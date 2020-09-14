import { createWriteStream, existsSync, mkdir as fsMkdir } from 'fs'
import { parse } from 'node-html-parser'
import { promisify } from 'util'
import * as prompts from 'prompts'
import * as program from 'commander'
import * as unzipper from 'unzipper'
import * as path from 'path'

import { detectOperatingSystem, versionToComparableVersion, mapOS } from './utils'
import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile } from './api'
import { IMappedVersion, IChromeConfig, ConfigWrapper, IStoreConfig } from './interfaces'
import { logger } from './loggerSpinner'
import { storeNegativeHit, loadStore } from './store'
import { downloadStore } from './load'
import { LOCAL_STORE_FILE } from './constants'
import * as packageJson from './package.json'

const mkdir = promisify(fsMkdir)

/**
 * Checks the arguments passed to the programm and returns them
 */
function readConfig(): ConfigWrapper {
    program
        .version(packageJson.version)
        .option('-m, --min <version>', 'The minimum version', '0')
        .option('-M, --max <version>', 'The maximum version. Newest version if not specificied', '10000')
        .option('-r, --max-results <results>', 'The maximum amount of results to choose from', NaN)
        .option('-o, --os <os>', 'The operating system for what the binary should be downloaded')
        .option('-a, --arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .option('-d, --decreaseOnFail', 'If a binary does not exist, go to the next lower version number and try again (regarding --min, --max and --max-results)')
        .option('-i, --increaseOnFail', 'If a binary does not exist, go to the next higher version number and try again (regarding --min, --max and --max-results), overwrites "--decreaseOnFail" if both set')
        .option('-z, --unzip', 'Directly unzip the downloaded zip-file and delete the .zip afterwards')
        .option('-n, --non-interactive', 'Don\'t show the selection menu. Automatically select the newest version. Only works when -d or -i is also set.', false)
        .option('-t, --no-store', 'Don\'t store negative hits in the local store file.', true)
        .option('-l, --no-download', 'Don\'t download the binary. It also continues with the next version, if --decreaseOnFail or --increaseOnFail is set. Useful to build up the negative hit store', true)
        .option('--load-store <url>', 'Download a localstore.json file from an URL')
        .option('-H, --hide-negative-hits', 'Hide negative hits', false)
        .option('-f, --folder <folder>', 'Set the download folder', null)
        .option('-O, --only-newest-major', 'Show only the newest major version in user selection', false)
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    const minIsSet = program.min > 0
    const maxResultsIsSet = !isNaN(program.maxResults)

    const os = mapOS(program.os || process.platform)

    if (!program.os && program.arch) {
        logger.warn('Setting "--arch" has no effect, when "--os" is not set!')
    }
    if (program.nonInteractive && !program.decreaseOnFail) {
        logger.warn('Setting "--non-interactive" has no effect, when "--decreaseOnFail" is not set!')
    }

    const is64Bit = (program.os && program.arch) ? program.arch === 'x64' : true

    if (program.loadStore) {
        return {
            action: 'loadStore',
            config: {
                url: program.loadStore,
            },
        }
    }

    return {
        action: 'loadChrome',
        config: {
            autoUnzip: !!program.unzip,
            min,
            max,
            results: minIsSet && !maxResultsIsSet ? Infinity : (program.maxResults || 10),
            os,
            arch: is64Bit ? 'x64' : 'x86',
            onFail: program.increaseOnFail ? 'increase' : program.decreaseOnFail ? 'decrease' : 'nothing',
            interactive: !program.nonInteractive,
            store: program.store,
            download: program.download,
            downloadUrl: program.loadStore,
            hideNegativeHits: program.hideNegativeHits,
            downloadFolder: program.folder,
            onlyNewestMajor: program.onlyNewestMajor,
        },
    }
}

/**
 * Parses the chromium tags and returns all chromium versions
 */
async function loadVersions(): Promise<string[]> {
    const tags = await fetchChromiumTags()

    const parsedTags = parse(tags) as unknown as (HTMLElement & { valid: boolean })

    const h3s = parsedTags.querySelectorAll('h3')

    let tagsHeadline: any
    h3s.forEach((h3: any) => {
        if (h3.text === 'Tags') {
            tagsHeadline = h3
        }
    })

    if (!tagsHeadline) {
        throw new Error('Tags headline not found in HTML')
    }

    const tagsList = tagsHeadline.parentNode.childNodes[1]

    if (!tagsList) {
        throw new Error('No list of tags found under tags headline')
    }

    const versions: string[] = []
    tagsList.childNodes.forEach((tag: any) => {
        versions.push(tag.text)
    });

    return versions
}

function mapVersions(versions: string[], config: IChromeConfig, store: Set<string>): IMappedVersion[] {
    const filteredVersions = versions
        .map(version => ({
            value: version,
            comparable: versionToComparableVersion(version),
            disabled: store.has(version),
        }))
        .sort((a, b) => b.comparable - a.comparable) // descending
        .filter(version => version.comparable >= config.min && version.comparable <= config.max)
        .filter(version => !config.hideNegativeHits || !version.disabled)

        // Don't reduce the amount of filtered versions when --only-newest-major is set
        // because the newest available major version might be disabled for the current os 
        return config.onlyNewestMajor
            ? filteredVersions
            : filteredVersions.slice(0, Number(config.results))
}

/**
 * Lets the user select a version via CLI prompt and returns it.
 * If the amount of results in the config is set to 1, the first version is returned
 */
async function userSelectedVersion(versions: IMappedVersion[], config: IChromeConfig): Promise<string | null> {
    if (config.results === '1') {
        return versions[0].disabled ? null : versions[0].value
    }

    if (config.onlyNewestMajor) {
        versions = versions.filter((version, index, versionArray) => {
            const previous = versionArray[index - 1]
            const previousMajor = previous?.value?.split('.')[0]
            const currentMajor = version?.value?.split('.')[0]
            return (currentMajor !== previousMajor || previous?.disabled) && !version?.disabled
        }).slice(0, Number(config.results))
    }

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        warn: 'This version seems to not have a binary',
        choices: versions,
        hint: `for ${config.os} ${config.arch}`
    } as any)
    return version
}

async function main(): Promise<void> {
    const configWrapper = readConfig()

    if (configWrapper.action === 'loadStore') {
        const config: IStoreConfig = configWrapper.config
        await downloadStore(config, LOCAL_STORE_FILE)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        await downloadChromium(config)
    } else {
        logger.error(`Failed to read config: ${configWrapper}`)
    }
}

async function downloadChromium(config: IChromeConfig): Promise<void> {
    const versions = await loadVersions()
    const store = await loadStore()
    const storeByOs = new Set(store[config.os][config.arch])
    const mappedVersions = mapVersions(versions, config, storeByOs)

    const [urlOS, filenameOS] = detectOperatingSystem(config)

    let chromeUrl: string | undefined

    const isAutoSearch = !config.interactive && config.onFail === "decrease"

    let selectedVersion = isAutoSearch
        ? mappedVersions[0].value
        : await userSelectedVersion(mappedVersions, config)

    if (isAutoSearch) {
        logger.info(`Auto-searching with version ${selectedVersion}`)
    }

    do {
        if (!selectedVersion) {
            break
        }
        const branchPosition = await fetchBranchPosition(selectedVersion);

        logger.start(['Searching for binary...', 'Binary found.', 'No binary found!'])
        chromeUrl = await fetchChromeUrl(branchPosition, urlOS, filenameOS)

        if (chromeUrl && config.download) {
            break
        }

        const index = mappedVersions.findIndex(version => version.value === selectedVersion)

        if (!chromeUrl) {
            const invalidVersion = mappedVersions[index]
            logger.error()
            invalidVersion.disabled = true
            if (config.store) {
                await storeNegativeHit(invalidVersion, config.os, config.arch)
            }
        } else {
            logger.warn('Not downloading binary.')
        }

        switch (config.onFail) {
            case 'increase':
                if (index > 0) {
                    selectedVersion = mappedVersions[index - 1].value
                    logger.info(`Continue with next higher version "${selectedVersion}"`)
                } else {
                    selectedVersion = null
                }
                break
            case 'decrease':
                if (index < mappedVersions.length - 1) {
                    selectedVersion = mappedVersions[index + 1].value
                    logger.info(`Continue with next lower version "${selectedVersion}"`)
                } else {
                    selectedVersion = null
                }
                break
            case 'nothing':
                selectedVersion = await userSelectedVersion(mappedVersions, config)
                break
        }
    } while (!chromeUrl || !config.download)

    if (chromeUrl && config.download) {
        logger.success()
        const filename = `chrome-${filenameOS}-${config.arch}-${selectedVersion}`
        const downloadPath = config.downloadFolder
            ? path.join(config.downloadFolder, filename)
            : filename

        if (!!config.downloadFolder && !existsSync(config.downloadFolder)) {
            await mkdir(config.downloadFolder, { recursive: true })
            console.log(config.downloadFolder, ' created')
        }

        logger.start(['Downloading binary...', config.autoUnzip ? `Successfully downloaded and extracted to ${downloadPath}/` : `${downloadPath}.zip successfully downloaded`])

        await fetchChromeZipFile(chromeUrl).then(res => {
            if (config.autoUnzip) {
                res.body.pipe(
                    unzipper.Extract({ path: downloadPath })
                )
                    .on('close', () => {
                        logger.success()
                    })
            } else {
                const file = createWriteStream(downloadPath + '.zip')
                res.body.pipe(file)
                file.on('close', () => {
                    logger.success()
                })
            }
        })
    }
}

main().then(() => {

}).catch(error => {
    console.error(error)
})
