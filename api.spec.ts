import { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile, fetchLocalStore } from './api'
import { IOSSettings } from './interfaces/os.interfaces'
import { logger, Spinner } from './log/spinner'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const fetch = require('node-fetch')

const onMock = jest.fn()

jest.mock('node-fetch', () => jest.fn())
jest.mock('node-fetch-progress', () => jest.fn(() => ({
    on: onMock,
})))
jest.mock('./log/spinner')
jest.mock('./log/progress')

describe('api', () => {

    let loggerMock: MaybeMockedDeep<Spinner>
    let fetchMock: MaybeMocked<typeof fetch>

    beforeAll(() => {
        fetchMock = mocked(fetch)
        loggerMock = mocked(logger, true)
    })

    beforeEach(() => {
        onMock.mockReset()
        fetchMock.mockClear()

        loggerMock.start.mockClear()
        loggerMock.success.mockClear()
        loggerMock.error.mockClear()
    })

    describe('fetchLocalStore', () => {
        it('should return the parsed store file', async () => {
            const url = 'local-store-url'

            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({ some: 'store' })
                }
            })

            expect(await fetchLocalStore(url)).toEqual({ some: 'store' })
            expect(fetchMock.mock.calls.length).toBe(1)
            expect(fetch).toHaveBeenCalledWith(url)
        })

        it('should throw an error on non-ok http response', async () => {
            const url = 'local-store-url'

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchLocalStore(url)).rejects.toThrow(new Error('Status Code: 400 some-error-message'))

            expect(fetchMock.mock.calls.length).toBe(1)
            expect(fetch).toHaveBeenCalledWith(url)
        })
    })

    describe('fetchChromiumTags', () => {
        it('should fetch chromium tags as text', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                text() {
                    return Promise.resolve('some-html')
                }
            })

            expect(await fetchChromiumTags()).toEqual('some-html')
            expect(fetch).toHaveBeenLastCalledWith('https://chromium.googlesource.com/chromium/src/+refs')
            expect(fetchMock.mock.calls.length).toBe(1)
        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromiumTags()).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })
    })

    describe('fetchBranchPosition', () => {
        it('should fetch the branch position', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({ chromium_base_position: 3 })
                }
            })

            expect(await fetchBranchPosition('any-version')).toEqual(3)
            expect(fetch).toHaveBeenLastCalledWith('https://omahaproxy.appspot.com/deps.json?version=any-version')
            expect(loggerMock.success).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(0)

        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromiumTags()).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })

        it('should log an error on no branch position', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({})
                }
            })

            expect(await fetchBranchPosition('any-version')).toEqual(undefined)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.success).toHaveBeenCalledTimes(0)
        })
    })

    describe('fetchChromeUrl', () => {
        it('should fetch the chrome url', async () => {
            const branchPosition = 'branch-position'
            const osSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux',
            }

            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({
                        items: [
                            {
                                name: 'Linux_x64/branch-position/chrome-linux.zip',
                                mediaLink: 'media-link',
                            },
                            {
                                name: 'other-name',
                                mediaLink: 'other-media-link',
                            },
                        ]
                    })
                }
            })

            expect(await fetchChromeUrl(branchPosition, osSettings)).toEqual('media-link')
        })

        it('should throw an error on non-ok http response', async () => {
            const osSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux',
            }

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromeUrl('', osSettings)).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })

        it('should resolve undefined if metadata contains no items', async () => {
            const branchPosition = 'branch-position'
            const osSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux',
            }

            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({})
                }
            })

            expect(await fetchChromeUrl(branchPosition, osSettings)).toEqual(undefined)
        })

        it('should resolve undefined if items contain no medialink', async () => {
            const branchPosition = 'branch-position'
            const osSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux',
            }

            fetchMock.mockResolvedValue({
                ok: true,
                json() {
                    return Promise.resolve({
                        items: [
                            {
                                name: 'url-os/branch-position/chrome-filename-os.zip',
                            },
                            {
                                name: 'other-name',
                            },
                        ]
                    })
                }
            })

            expect(await fetchChromeUrl(branchPosition, osSettings)).toEqual(undefined)
        })
    })

    describe('fetchChromeZipFile', () => {
        it('should load the chrome zip file and return the promise', async () => {
            const url = 'some-url'

            fetchMock.mockResolvedValue({
                ok: true,
            })

            await expect((fetchChromeZipFile(url))).resolves.toEqual({ ok: true })
        })

        it('should throw an error on non-ok http response', async () => {
            const url = 'some-url'

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromeZipFile(url)).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })
    })
})
