import { createWriteStream } from 'fs'
import { parse } from 'node-html-parser'
import * as prompts from 'prompts'
import * as program from 'commander'
import * as unzipper from 'unzipper'

import { detectOperatingSystem, versionToComparableVersion, mapOS } from './utils';
import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile } from './api'
import { IConfig, IMappedVersion, Store } from './interfaces';
import { logger } from './loggerSpinner'
import { storeNegativeHit, loadStore } from './store'

/**
 * Checks the arguments passed to the programm and returns them
 */
function readConfig(): IConfig {
    program
        .version(require('./package.json').version)
        .option('-m, --min <version>', 'The minimum version', '0')
        .option('-M, --max <version>', 'The maximum version. Newest version if not specificied', '10000')
        .option('-r, --max-results <results>', 'The maximum amount of results to choose from', 10)
        .option('-o, --os <os>', 'The operating system for what the binary should be downloaded')
        .option('-a, --arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .option('-d, --decreaseOnFail', 'If a binary does not exist, go to the next lower version number and try again (regarding --min, --max and --max-results)')
        .option('-i, --increaseOnFail', 'If a binary does not exist, go to the next higher version number and try again (regarding --min, --max and --max-results), overwrites "--decreaseOnFail" if both set')
        .option('-z, --unzip', 'Directly unzip the downloaded zip-file and delete the .zip afterwards')
        .option('-n, --non-interactive', 'Don\'t show the selection menu. Automatically select the newest version. Only works when -d or -i is also set.', false)
        .option('-t, --no-store', 'Don\'t store negative hits in the local store file.', true)
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    const os = mapOS(program.os || process.platform)

    if (!program.os && program.arch) {
        logger.warn('Setting "--arch" has no effect, when "--os" is not set!')
    }
    if (program.nonInteractive && !program.decreaseOnFail) {
        logger.warn('Setting "--non-interactive" has no effect, when "--decreaseOnFail" is not set!')
    }

    const is64Bit = (program.os && program.arch) ? program.arch === 'x64' : true

    return {
        autoUnzip: !!program.unzip,
        min,
        max,
        results: program.maxResults,
        os,
        arch: is64Bit ? 'x64' : 'x86',
        onFail: program.increaseOnFail ? 'increase' : program.decreaseOnFail ? 'decrease' : 'nothing',
        interactive: !program.nonInteractive,
        store: program.store,
    }
}

async function loadVersions(): Promise<string[]> {
    const tags = await fetchChromiumTags()

    const parsedTags = parse(tags) as unknown as (HTMLElement & {valid: boolean})

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

    const versions = []
    tagsList.childNodes.forEach(tag => {
        versions.push(tag.text)
    });

    return versions
}

function mapVersions(versions: string[], config: IConfig, store: Set<string>): IMappedVersion[] {
    return versions
        .map(version => ({
            value: version,
            comparable: versionToComparableVersion(version),
            disabled: store.has(version),
        }))
        .sort((a,b) => b.comparable - a.comparable) // descending
        .filter(version => version.comparable >= config.min && version.comparable <= config.max)
        .slice(0, Number(config.results))
}

async function userSelectedVersion(versions: IMappedVersion[], config: IConfig): Promise<string> {
    if (config.results === '1') {
        return versions[0].disabled ? null : versions[0].value
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
    const config = readConfig()
    const versions = await loadVersions()
    const store = await loadStore()
    const storeByOs = new Set(store[config.os][config.arch])
    const mappedVersions = mapVersions(versions, config, storeByOs)

    const [urlOS, filenameOS] = detectOperatingSystem(config)

    let chromeUrl: string

    const isAutoSearch = !config.interactive && config.onFail === "decrease"

    let selectedVersion = isAutoSearch
        ? mappedVersions[0].value
        : await userSelectedVersion(mappedVersions, config)

    if (isAutoSearch) {
        logger.info(`Auto-searching with version ${selectedVersion}`)
    }

    do {
        if (!selectedVersion) {
            logger.info('quitting...')
            break
        }
        const branchPosition = await fetchBranchPosition(selectedVersion);
    
        logger.start(['Searching for binary...', 'Binary found.', 'No binary found!'])
        chromeUrl = await fetchChromeUrl(branchPosition, urlOS, filenameOS)
        
        if (!chromeUrl) {
            const index = mappedVersions.findIndex(version => version.value === selectedVersion)
            const invalidVersion = mappedVersions[index]

            if (config.store) {
                await storeNegativeHit(invalidVersion, config.os, config.arch)
            }

            logger.error()
            invalidVersion.disabled = true

            switch(config.onFail) {
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
        }
    } while (!chromeUrl)
    if (chromeUrl) {
        logger.success()
        const filename = `chrome-${filenameOS}-${config.arch}-${selectedVersion}`

        await fetchChromeZipFile(chromeUrl, filename, config).then(res => {
            if (config.autoUnzip) {
                res.body.pipe(
                    unzipper.Extract({path: filename})
                )
                .on('close', () => {
                    logger.success()
                })
            } else {
                const file = createWriteStream(filename+'.zip')
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
