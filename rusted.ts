import { createWriteStream } from 'fs'
import { parse } from 'node-html-parser'
import * as fetch  from 'node-fetch'
import * as prompts from 'prompts'
import * as program from 'commander'
import * as unzipper from 'unzipper'

import { IConfig, IMappedVersion, IMetadataResponse } from './interfaces'
import { logger } from './loggerSpinner'

const CHROMIUM_TAGS_URL = 'https://chromium.googlesource.com/chromium/src/+refs'

function checkStatus(response) {
    if (!response.ok) {
        throw new Error(`Status Code: ${response.status} ${response.error}`)
    }
    return response
}

function detectOperatingSystem(config: IConfig): [string, string] {

    const archForUrl = config.arch === 'x64' ? '_x64' : ''

    switch(config.os) {
        case 'linux':
            return [`Linux${archForUrl}`, 'linux']
        case 'win32':
        case 'win':
            return [`Win${archForUrl}`, 'win']
        case 'darwin':
        case 'mac':
            if (config.arch === 'x86') {
                console.warn('WARN: A mac version is not available for "x86" architecture, using "x64"!')
                config.arch = 'x64'
            }
            return ['Mac', 'mac']
        default:
            throw new Error(`Unsupported operation system: ${config.os}`)
    }
}

/**
 * Pads each version part except major (so minor, branch and patch) with at least one digit more as now necessary
 * so versions can be compared just by < and <= as strings
 * E.g. "79.0.3945.10" will become "7900039450010"
 */
function versionToComparableVersion(version: string): number {
    const splitVersion = version.split('.')
    const paddedSplitVersion = splitVersion.concat(Array(4 - splitVersion.length).fill('0'))

    return parseInt(paddedSplitVersion[0]
         + paddedSplitVersion[1].padStart(2, '0')
         + paddedSplitVersion[2].padStart(5, '0')
         + paddedSplitVersion[3].padStart(4, '0'), 10)
}

/**
 * Checks the arguments passed to the programm and returns them
 */
function readConfig(): IConfig {
    program
        .version(require('./package.json').version)
        .option('--min <version>', 'The minimum version', '0')
        .option('--max <version>', 'The maximum version. Newest version if not specificied', '10000')
        .option('--max-results <results>', 'The maximum amount of results to choose from', 10)
        .option('--os <os>', 'The operating system for what the binary should be downloaded')
        .option('--arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .option('-d, --decreaseOnFail', 'If a binary does not exist, go to the next lower version number and try again (regarding --min, --max and --max-results)')
        .option('-i, --increaseOnFail', 'If a binary does not exist, go to the next higher version number and try again (regarding --min, --max and --max-results), overwrites "--decreaseOnFail" if both set')
        .option('--unzip', 'Directly unzip the downloaded zip-file and delete the .zip afterwards')
        .option('-n, --non-interactive', 'Don\'t show the selection menu. Automatically select the newest version. Only works when -d or -i is also set.', false)
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    const os = program.os || process.platform

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
    }
}

async function fetchChromiumTags(): Promise<any> {
    return fetch(CHROMIUM_TAGS_URL)
    .then(checkStatus)
    .then(response => response.text())
}

async function fetchVersions(): Promise<string[]> {
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

function mapVersions(versions: string[], config: IConfig): IMappedVersion[] {
    return versions
        .map(version => ({
            value: version,
            comparable: versionToComparableVersion(version),
            disabled: false,
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

async function fetchBranchPosition(version: string): Promise<string> {
    logger.start(['Resolving version to branch position...', 'Version resolved!', 'Error resolving version!'])
    return fetch(`https://omahaproxy.appspot.com/deps.json?version=${version}`)
        .then(checkStatus)
        .then(response => response.json())
        .then(response => response.chromium_base_position)
        .then(resolvedVersion => {
            if (resolvedVersion) {
                logger.success()
            } else {
                logger.error()
            }
            return resolvedVersion
        })
}

async function fetchChromeUrl(branchPosition: string, urlOS: string, filenameOS: string): Promise<string> {
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${urlOS}/${branchPosition}/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken`
    // TODO: adjust field in request
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(response => response.json())

        return chromeMetadataResponse.items?.find(item => item.name === `${urlOS}/${branchPosition}/chrome-${filenameOS}.zip`)?.mediaLink
}

async function fetchChromeZipFile(url: string, filenameOS: string, config: IConfig, version: string): Promise<void> {
    const filename = `chrome-${filenameOS}-${config.arch}-${version}`
    logger.start(['Downloading binary...', config.autoUnzip ? `Successfully downloaded and extracted to ${filename}/` : `${filename}.zip successfully downloaded`])
    return fetch(url)
        .then(checkStatus)
        .then(res => {
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

async function main(): Promise<void> {
    const config = readConfig()
    const versions = await fetchVersions()
    const mappedVersions = mapVersions(versions, config)

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
        await fetchChromeZipFile(chromeUrl, filenameOS, config, selectedVersion)
    }
}

main().then(() => {

}).catch(error => {
    console.error(error)
})
