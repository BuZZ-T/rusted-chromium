import { parse } from 'node-html-parser'
import * as fetch  from 'node-fetch'
import * as prompts from 'prompts'
import * as program from 'commander'
import { Choice } from 'prompts'
import { createWriteStream } from 'fs'
import { type } from 'os'

interface IConfig {
    min: number
    max: number
    results: string
}

interface IMetadata {
    kind: string
    mediaLink: string
    name: string
    size: string
    updated: string
    metadata: {
        'cr-commit-position': string
        'cr-commit-position-number': string
        'cr-git-commit': string
    }
}

interface IMetadataResponse {
    kind: string
    items: IMetadata[]
}

const CHROMIUM_TAGS_URL = 'https://chromium.googlesource.com/chromium/src/+refs'

function checkStatus(response) {
    if (!response.ok) {
        throw new Error()
    }
    return response
}

function determineOperatingSystem(): [string, string] {
    return ['Linux_x64', 'linux']
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
        .parse(process.argv)

    const min = versionToComparableVersion(program.min)
    const max = versionToComparableVersion(program.max)

    return {
        min,
        max,
        results: program.maxResults
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

async function userSelectedVersion(versions: string[], config: IConfig): Promise<string> {
    const sortedVersions = versions
        .map(version => ({
            value: version,
            comparable: versionToComparableVersion(version),
        }))
        .sort((a,b) => b.comparable - a.comparable) // descending
        .filter(version => version.comparable >= config.min && version.comparable <= config.max)
        .slice(0, Number(config.results))

    if (config.results === '1') {
        return sortedVersions[0].value
    }

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        choices: sortedVersions as unknown as Choice[],
    })
    return version
}

async function fetchBranchPosition(version: string): Promise<string> {
    console.log('Resolving version to branch position...')
    return fetch(`https://omahaproxy.appspot.com/deps.json?version=${version}`)
        .then(checkStatus)
        .then(response => response.json())
        .then(response => response.chromium_base_position)
}

async function fetchChromeUrl(branchPosition: string): Promise<[string, string]> {
    const [urlOS, filenameOS] = determineOperatingSystem()

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
    const selectedVersion = await userSelectedVersion(versions, config)
    const branchPosition = await fetchBranchPosition(selectedVersion)

    const [chromeUrl, filenameOS] = await fetchChromeUrl(branchPosition)

    if (chromeUrl && filenameOS) {
        await fetchChromeZipFile(chromeUrl, filenameOS, selectedVersion)
    } else {
        console.log(`no binary found for version "${selectedVersion}" for Linux_x84`)
    }
}

main().then(() => {

}).catch(error => {
    console.error(error)
})
