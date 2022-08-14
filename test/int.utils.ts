import { Response as NodeFetchResponse, RequestInfo as NodeFetchRequestInfo, Request as NodeFetchRequest } from 'node-fetch'
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'

import { Store } from '../store/Store'
import { testMetadataResponse } from './test.metadata'

const unmockedNodeFetch = jest.requireActual('node-fetch')

export interface IMocks {
    mockStream: PassThrough | Readable
}

export type MockNames = 'chromeZip' | 'tags' | 'branchPosition' | 'chromeUrl'

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
const tagsResponse = (tags: string[] = ['10.0.0.0']): string => `<html><body><h3>Tags</h3><span>${tags.map(tag => `<span>${tag}</span>`).join('')}</span></body></html>`
export const branchPositionResponse = (branchPosition = '12345'): string => branchPosition ? `{"chromium_base_position": "${branchPosition}"}` : ''

const mocks: IMock[] = [
    {
        name: 'chromeZip',
        url: 'https://www.googleapis.com/download/storage',
        mock: () => chromeZipStream,
    },
    {
        name: 'tags',
        url: 'https://chromium.googlesource.com/chromium/src/+refs',
        mock: ({ tags }: MockParams) => tagsResponse(tags),
    },
    {
        name: 'branchPosition',
        url: 'https://omahaproxy.appspot.com/deps.json',
        mock: ({ branchPosition }: MockParams) => branchPositionResponse(branchPosition),
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
export function mockNodeFetch(nodeFetchMock: MaybeMockedDeep<any>, { params, config, urls }: IMockOptions = {}): void {

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

/**
 * Updates the localstore for integration tests. Don't ever call this in unit tests,
 * as it will update the actual localstore.json (as fs is not mocked there...)
 * @param store
 * @returns 
 */
export function setLocalstore(store: Store): Promise<void> {
    return writeFile(join(__dirname, 'localstore.json'), store.toFormattedString())
}

export async function getJestTmpFolder(): Promise<string | undefined> {
    const files = await readdir('/tmp', { encoding: 'utf-8' })
    return files.find(file => file.startsWith('jest_'))
}

// https://stackoverflow.com/questions/2438800/what-is-the-smallest-legal-zip-jar-file
export const minimalValidZipfile = new Uint8Array([80, 75, 5, 6].concat(Array.from({length: 18}).map(() => 0)))
