import * as fetch  from 'node-fetch'

import { logger } from './loggerSpinner'
import { IMetadataResponse, IConfig } from './interfaces'

const CHROMIUM_TAGS_URL = 'https://chromium.googlesource.com/chromium/src/+refs'

function checkStatus(response) {
    if (!response.ok) {
        throw new Error(`Status Code: ${response.status} ${response.error}`)
    }
    return response
}

export async function fetchChromiumTags(): Promise<any> {
    return fetch(CHROMIUM_TAGS_URL)
    .then(checkStatus)
    .then(response => response.text())
}

export async function fetchBranchPosition(version: string): Promise<string> {
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

export async function fetchChromeUrl(branchPosition: string, urlOS: string, filenameOS: string): Promise<string> {
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${urlOS}/${branchPosition}/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken`
    // TODO: adjust field in request
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(response => response.json())

        return chromeMetadataResponse.items?.find(item => item.name === `${urlOS}/${branchPosition}/chrome-${filenameOS}.zip`)?.mediaLink
}

export async function fetchChromeZipFile(url: string, filename: string, config: IConfig): Promise<any> {
    logger.start(['Downloading binary...', config.autoUnzip ? `Successfully downloaded and extracted to ${filename}/` : `${filename}.zip successfully downloaded`])
    return fetch(url)
        .then(checkStatus)
}
