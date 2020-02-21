import { parse } from 'node-html-parser'
import * as fetch  from 'node-fetch'
import * as prompts from 'prompts'
import * as program from 'commander'
import { createWriteStream } from 'fs'

import { IConfig, IMappedVersion, IMetadataResponse } from './interfaces'

const CHROMIUM_TAGS_URL = 'https://chromium.googlesource.com/chromium/src/+refs'

function checkStatus(response) {
    if (!response.ok) {
        throw new Error()
    }
    return response
}

function detectOperatingSystem(config: IConfig): [string, string] {
    const os = config.os || process.platform
    switch(os) {
        case 'linux':
            return ['Linux_x64', 'linux']
        case 'win32':
        case 'win':
            return ['Win_x64', 'win']
        case 'darwin':
        case 'mac':
            return ['Mac', 'mac']
        default:
            throw new Error(`Unsupported operation system: ${os}`)
    }
}

/**
 * Pads each version part except major (so minor, branch and patch) with at least one digit as now necessary
 * so versions can be compared just by < and <= as strings
 * @param version 
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
function checkProgramArguments(): IConfig {
    program
        .option('--min <version>', 'The minimum version', '0')
        .option('--max <version>', 'The maximum version. Newest version if not specificied', '10000')
        .option('--max-results <results>', 'The maximum amount of results to choose from', 10)
        .option('--os <os>', 'The operating system for what the binary should be downloaded')
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    return {
        min,
        max,
        results: program.maxResults,
        os: program.os
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
        return versions[0].value
    }

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        warn: 'This version seems to not have a binary',
        choices: versions,
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

async function fetchChromeUrl(branchPosition: string, config: IConfig): Promise<[string, string]> {
    const [urlOS, filenameOS] = detectOperatingSystem(config)

    console.log('Searching for binary...')
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${urlOS}/${branchPosition}/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken`
    // TODO: adjust field in request
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(response => response.json())

    if (chromeMetadataResponse.items) {
        const chromeMetadata = chromeMetadataResponse.items.find(item => item.name === `${urlOS}/${branchPosition}/chrome-${filenameOS}.zip`)
        return [chromeMetadata.mediaLink, filenameOS]
    }
    return [null, null]
}

async function fetchChromeZipFile(url: string, filenameOS: string, version: string): Promise<void> {
    console.log('Binary found. Downloading...')
    const filename = `chrome-${filenameOS}-${version}.zip`
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

async function main(): Promise<any> {
    const config = checkProgramArguments()
    const versions = await fetchVersions()
    const mappedVersions = mapVersions(versions, config)

    let chromeUrl: string
    let filenameOS: string
    let selectedVersion: string
    do {
        selectedVersion = await userSelectedVersion(mappedVersions, config)
        if (!selectedVersion) {
            break
        }
        const branchPosition = await fetchBranchPosition(selectedVersion);
    
        [chromeUrl, filenameOS] = await fetchChromeUrl(branchPosition, config)
        
        if (!chromeUrl && !filenameOS) {
            const invalidVersion = mappedVersions.find(version => version.value === selectedVersion)
            invalidVersion.disabled = true
        }
    } while (!chromeUrl)
    if (chromeUrl && filenameOS) {
        await fetchChromeZipFile(chromeUrl, filenameOS, selectedVersion)
    }
}

main().then(() => {

}).catch(error => {
    console.error(error)
})
