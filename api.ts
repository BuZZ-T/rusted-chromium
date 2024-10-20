import type { Response as NodeFetchResponse } from 'node-fetch'

import type { IMetadataResponse } from './interfaces/interfaces'
import type { Channel, IOSSettings, Platform } from './interfaces/os.interfaces'
import type { ApiRelease } from './releases/release.types'

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const fetch = require('node-fetch')

function checkStatus(response: NodeFetchResponse) {
    if (!response.ok) {
        // TODO: check of response.error is correct
        throw new Error(`Status Code: ${response.status} ${response.url} ${(response as (NodeFetchResponse & { error: string })).error}`)
    }
    return response
}

const toJson = (response: Response): Promise<unknown> => response.json()

export async function fetchChromeUrl(branchPosition: number, osSettings: IOSSettings): Promise<string | undefined> {
    const snapshotUrl = `https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=${osSettings.url}/${branchPosition}/&fields=items(mediaLink,name)`
    const chromeMetadataResponse: IMetadataResponse = await fetch(snapshotUrl)
        .then(checkStatus)
        .then(toJson)

    return chromeMetadataResponse.items?.find(item => item.name === `${osSettings.url}/${branchPosition}/chrome-${osSettings.filename}.zip`)?.mediaLink
}

export async function fetchChromeZipFile(url: string): Promise<NodeFetchResponse> {
    const response = await fetch(url)
    return checkStatus(response)
}

export async function fetchReleases(platform: Platform, channel: Channel, amount = 100): Promise<ApiRelease[]> {
    return fetch(`https://chromiumdash.appspot.com/fetch_releases?channel=${channel}&platform=${platform}&num=${amount}&offset=0`)
        .then(checkStatus)
        .then(toJson)
}
