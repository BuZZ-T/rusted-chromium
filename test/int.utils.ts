import type { Response as NodeFetchResponse, RequestInfo as NodeFetchRequestInfo, Request as NodeFetchRequest } from 'node-fetch'
import { readdir } from 'node:fs/promises'
import type { Readable } from 'node:stream'
import { PassThrough } from 'node:stream'

import { testMetadataResponse } from './test.metadata'
import type { ApiRelease } from '../releases/release.types'

const unmockedNodeFetch = jest.requireActual('node-fetch')

export interface IMocks {
    mockStream: PassThrough | Readable
}

export type MockNames = 'chromeZip' | 'chromeUrl' | 'releases'

export type MockParams = {
    [key in MockNames]?: any
}

export type MockConfig = {
    [key in MockNames]?: IMocksConfig
}

export interface IMockOptions {
    params?: MockParams
    config?: MockConfig
    urls?: IMockAdditional[]
}

export interface IMock {
    /**
     * Name of the request to mock
     */
    name: MockNames
    /**
     * url matcher (matched using string.startsWith(url))
     */
    url: string
    /**
     * Function to return a response, optionally based on params
     */
    mock: (params: MockParams) => string | NodeJS.ReadableStream
}

export type IMockAdditional = IMockOnce | IMockDifferent

export interface IMockOnce {
    once: true
    name: string
    gen: () => IteratorResult<string, void>
    mock: (param: string) => string
}

export interface IMockDifferent {
    once: false
    url: string
    mock: () => string
}

export let chromeZipStream: PassThrough

const apiReleases: Record<string, ApiRelease> = {
    '10.0.0.0': {
        channel: 'Beta',
        chromium_main_branch_position: 12345,
        hashes: {},
        milestone: 1,
        platform: 'Linux',
        previous_version: '9.0.0.0',
        time: 2,
        version: '10.0.0.0'
    },
    '20.0.0.0': {
        channel: 'Beta',
        chromium_main_branch_position: 12345,
        hashes: {},
        milestone: 1,
        platform: 'Linux',
        previous_version: '19.0.0.0',
        time: 3,
        version: '20.0.0.0',
    }
}

const releaseResponse = (releases: string[]): Array<ApiRelease | undefined> => releases.map(release => apiReleases[release])

const mocks: IMock[] = [
    {
        name: 'chromeZip',
        url: 'https://www.googleapis.com/download/storage',
        mock: () => chromeZipStream,
    },
    {
        name: 'releases',
        url: 'https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Linux&num=100&offset=0',
        mock: ({releases}) => JSON.stringify(releaseResponse(releases)),

    },
    {
        name: 'chromeUrl',
        url: 'https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots',
        mock: () => JSON.stringify(testMetadataResponse)
    }
]

export interface IMocksConfig {
    contentLength?: number
}

function getUrlFromRequestInfo(requestInfo: NodeFetchRequestInfo): string {
    if (typeof (requestInfo as { href: 'string' }).href === 'string') {
        return (requestInfo as { href: 'string' }).href
    }
    if (typeof (requestInfo as NodeFetchRequest).url === 'string') {
        return (requestInfo as NodeFetchRequest).url
    }

    return requestInfo as string
}

/**
 * Mocks all requests of node-fetch
 * Allows to pass params and config to the mock.
 *
 * - Using params, the function returning the mock data can be parameterized.
 * - Using config, the mocked node-fetch itself can be configured (e.g. headers can be added to the response)
 * - Using urls, addiotional URLs can be mocked
 * @param nodeFetchMock
 * @param options
 */
export function mockNodeFetch(nodeFetchMock: jest.MaybeMockedDeep<any>, { params, config, urls }: IMockOptions = {}): void {

    chromeZipStream = new PassThrough()

    nodeFetchMock.mockImplementation((url: NodeFetchRequestInfo): Promise<NodeFetchResponse> => {
        const stringUrl = getUrlFromRequestInfo(url)

        // additional mocks can be completely configured from the outside, no need to pass params or config for them...!
        // they are evaluated before the normal ones, to override them for only one call
        for (const mock of urls ?? []) {

            // an additional mock might be identified by name, then use the url of the default mock with the same name
            // use the passed url otherwise
            const mockUrl = mock.once === true
                ? mocks.find(defaultMock => defaultMock.name === mock.name)?.url
                : mock.url

            if (!mockUrl) {
                break
            }

            if (stringUrl.startsWith(mockUrl)) {

                const mockResponse = mock.once === true
                    ? mock.gen()
                    : mock.mock()

                // if the passed mock is a generator and it's not done, return the value, break to the default mock (next foreach) otherwise
                if (typeof mockResponse === 'object') {
                    if (mockResponse.done === false) {
                        return Promise.resolve(new unmockedNodeFetch.Response(mock.mock(mockResponse.value)))
                    }
                    break
                }

                return Promise.resolve(new unmockedNodeFetch.Response(mockResponse))
            }
        }

        for (const mock of mocks) {
            if (stringUrl.startsWith(mock.url)) {
                const mockConfig = config?.[mock.name]

                const response = mockConfig?.contentLength
                    ? new unmockedNodeFetch.Response(mock.mock(params ?? {}), { headers: { 'Content-Length': mockConfig.contentLength } })
                    : new unmockedNodeFetch.Response(mock.mock(params ?? {}))

                return Promise.resolve(response)
            }
        }

        throw new Error(`No mock found for url: ${url}`)
    })
}

export async function getJestTmpFolder(): Promise<string | undefined> {
    const files = await readdir('/tmp', { encoding: 'utf-8' })
    return files.find(file => file.startsWith('jest_'))
}

// https://stackoverflow.com/questions/2438800/what-is-the-smallest-legal-zip-jar-file
export const minimalValidZipfile = new Uint8Array([80, 75, 5, 6].concat(Array.from({length: 18}).map(() => 0)))
