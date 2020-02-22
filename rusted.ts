import { parse } from 'node-html-parser'
import * as fetch  from 'node-fetch'
import * as prompts from 'prompts'
import * as program from 'commander'
import { createWriteStream } from 'fs'

import { IConfig, IMappedVersion, IMetadataResponse } from './interfaces'

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
        .option('--min <version>', 'The minimum version', '0')
        .option('--max <version>', 'The maximum version. Newest version if not specificied', '10000')
        .option('--max-results <results>', 'The maximum amount of results to choose from', 10)
        .option('--os <os>', 'The operating system for what the binary should be downloaded')
        .option('--arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    const os = program.os || process.platform

    if (!program.os && program.arch) {
        console.warn('WARN: Setting "--arch" has no effect, when "--os" is not set!')
    }

    const is64Bit = (program.os && program.arch) ? program.arch === 'x64' : true

    return {
        min,
        max,
        results: program.maxResults,
        os,
        arch: is64Bit ? 'x64' : 'x86'
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
    console.log('Resolving version to branch position...')
    return fetch(`https://omahaproxy.appspot.com/deps.json?version=${version}`)
        .then(checkStatus)
        .then(response => response.json())
        .then(response => response.chromium_base_position)
}

async function fetchChromeUrl(branchPosition: string, urlOS: string, filenameOS: string): Promise<string> {
    console.log('Searching for binary...')
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${urlOS}/${branchPosition}/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken`
    // TODO: adjust field in request
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(response => response.json())

    if (chromeMetadataResponse.items) {
        const chromeMetadata = chromeMetadataResponse.items.find(item => item.name === `${urlOS}/${branchPosition}/chrome-${filenameOS}.zip`)
        return chromeMetadata.mediaLink
    }
    return null
}

async function fetchChromeZipFile(url: string, filenameOS: string, arch: string, version: string): Promise<void> {
    console.log('Binary found. Downloading...')
    const filename = `chrome-${filenameOS}-${arch}-${version}.zip`
    return fetch(url)
        .then(checkStatus)
        .then(res => {
            const file = createWriteStream(filename)
            res.body.pipe(file)
            file.on('close', () => {
                console.log(`${filename} successfully downloaded`)
            })
        })
}

async function main(): Promise<void> {
    const config = readConfig()
    const versions = await fetchVersions()
    const mappedVersions = mapVersions(versions, config)

    const [urlOS, filenameOS] = detectOperatingSystem(config)

    let chromeUrl: string
    let selectedVersion: string
    do {
        selectedVersion = await userSelectedVersion(mappedVersions, config)
        if (!selectedVersion) {
            console.log('quitting...')
            break
        }
        const branchPosition = await fetchBranchPosition(selectedVersion);
    
        chromeUrl = await fetchChromeUrl(branchPosition, urlOS, filenameOS)
        
        if (!chromeUrl) {
            const invalidVersion = mappedVersions.find(version => version.value === selectedVersion)
            console.log(`No binary found for version ${invalidVersion.value}`)
            invalidVersion.disabled = true
        }
    } while (!chromeUrl)
    if (chromeUrl) {
        await fetchChromeZipFile(chromeUrl, filenameOS, config.arch, selectedVersion)
    }
}

main().then(() => {

}).catch(error => {
    console.error(error)
})
