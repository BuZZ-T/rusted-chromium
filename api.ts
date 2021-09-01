import { Response as NodeFetchResponse } from 'node-fetch'

import { RESOLVE_VERSION } from './commons/constants'
import { IMetadataResponse } from './interfaces'
import { logger } from './log/spinner'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const fetch = require('node-fetch')

const CHROMIUM_TAGS_URL = 'https://chromium.googlesource.com/chromium/src/+refs'

function checkStatus(response: NodeFetchResponse) {
    if (!response.ok) {
        // TOOD: check of response.error is correct
        throw new Error(`Status Code: ${response.status} ${(response as any).error}`)
    }
    return response
}

const toJson = (response: Response): Promise<any> => response.json()

const toText = (response: Response): Promise<string> => response.text()

export async function fetchLocalStore(url: string): Promise<any> {
    return fetch(url)
        .then(checkStatus)
        .then(toJson)
        .then((json: any) => JSON.stringify(json, null, 2))
}

/**
 * Fetch all chromium tags (containing the version) via googlesource url
 */
export async function fetchChromiumTags(): Promise<any> {
    return fetch(CHROMIUM_TAGS_URL)
        .then(checkStatus)
        .then(toText)
}

export async function fetchBranchPosition(version: string): Promise<string> {
    logger.start(RESOLVE_VERSION)

    return fetch(`https://omahaproxy.appspot.com/deps.json?version=${version}`)
        .then(checkStatus)
        .then(toJson)
        .then((response: any) => response.chromium_base_position)
        .then((resolvedVersion: string | undefined) => {
            if (resolvedVersion) {
                logger.success()
            } else {
                logger.error()
            }
            return resolvedVersion
        })
}

export async function fetchChromeUrl(branchPosition: string, urlOS: string, filenameOS: string): Promise<string | undefined> {
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${urlOS}/${branchPosition}/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken`
    // TODO: adjust field in request
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(toJson)

    return chromeMetadataResponse.items?.find(item => item.name === `${urlOS}/${branchPosition}/chrome-${filenameOS}.zip`)?.mediaLink
}

export async function fetchChromeZipFile(url: string): Promise<NodeFetchResponse> {
    const response = await fetch(url)
    return checkStatus(response)
}
