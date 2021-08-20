import * as fetch from 'node-fetch'
import { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile, fetchLocalStore } from './api'
import { progress } from './log/progress'
import { logger, Spinner } from './log/spinner'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const Progress = require('node-fetch-progress')

const onMock = jest.fn()

jest.mock('node-fetch', () => jest.fn())
jest.mock('node-fetch-progress', () => jest.fn(() => ({
    on: onMock,
})))
jest.mock('./log/spinner')
jest.mock('./log/progress')

describe('api', () => {

    let loggerMock: MaybeMockedDeep<Spinner>
    let fetchMock: MaybeMocked<any>
    let progressConstructorMock: MaybeMockedDeep<any>
    let progressMock: MaybeMockedDeep<any>

    beforeAll(() => {
        fetchMock = mocked(fetch)
        progressConstructorMock = mocked(Progress)
        progressMock = mocked(progress, true)
        loggerMock = mocked(logger, true)
    })

    beforeEach(() => {
        onMock.mockReset()
        fetchMock.mockClear()

        progressConstructorMock.mockClear()

        progressMock.start.mockClear()
        progressMock.fraction.mockClear()

        loggerMock.start.mockClear()
        loggerMock.success.mockClear()
        loggerMock.error.mockClear()
    })

    describe('fetchLocalStore', () => {
        it('should return the formatted store file as text', async () => {
            const url = 'local-store-url'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({ some: 'store' })
                    }
                })
            )

            expect(await fetchLocalStore(url)).toEqual(
                `{
  "some": "store"
}`)
            expect(fetchMock.mock.calls.length).toBe(1)
            expect(fetch).toHaveBeenCalledWith(url)
        })

        it('should throw an error on non-ok http response', async () => {
            const url = 'local-store-url'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            await expect(() => fetchLocalStore(url)).rejects.toThrow(new Error('Status Code: 400 some-error-message'))

            expect(fetchMock.mock.calls.length).toBe(1)
            expect(fetch).toHaveBeenCalledWith(url)
        })
    })

    describe('fetchChromiumTags', () => {
        it('should fetch chromium tags as text', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    text() {
                        return Promise.resolve('some-html')
                    }
                })
            )

            expect(await fetchChromiumTags()).toEqual('some-html')
            expect(fetch).toHaveBeenLastCalledWith('https://chromium.googlesource.com/chromium/src/+refs')
            expect(fetchMock.mock.calls.length).toBe(1)
        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            await expect(() => fetchChromiumTags()).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })
    })

    describe('fetchBranchPosition', () => {
        it('should fetch the branch position', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({ chromium_base_position: 3 })
                    }
                })
            )

            expect(await fetchBranchPosition('any-version')).toEqual(3)
            expect(fetch).toHaveBeenLastCalledWith('https://omahaproxy.appspot.com/deps.json?version=any-version')
            expect(loggerMock.success).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(0)

        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            await expect(() => fetchChromiumTags()).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })

        it('should log an error on no branch position', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({})
                    }
                })
            )

            expect(await fetchBranchPosition('any-version')).toEqual(undefined)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.success).toHaveBeenCalledTimes(0)
        })
    })

    describe('fetchChromeUrl', () => {
        it('should fetch the chrome url', async () => {

            const urlOS = 'url-os'
            const branchPosition = 'branch-position'
            const filenameOS = 'filename-os'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({
                            items: [
                                {
                                    name: 'url-os/branch-position/chrome-filename-os.zip',
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
            )

            expect(await fetchChromeUrl(branchPosition, urlOS, filenameOS)).toEqual('media-link')
        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            await expect(() => fetchChromeUrl('', '', '')).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })
    })

    describe('fetchChromeZipFile', () => {
        it('should load the chrome zip file and return the promise', async () => {
            const url = 'some-url'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    something: 'something'
                })
            )

            expect((await fetchChromeZipFile(url)).something).toEqual('something')
        })

        it('should throw an error on non-ok http response', async () => {
            const url = 'some-url'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            await expect(() => fetchChromeZipFile(url)).rejects.toThrow(new Error('Status Code: 400 some-error-message'))
        })

        describe('Progress', () => {
            it('should start the progress', async () => {
                const url = 'some-url'

                fetchMock.mockImplementation((): Promise<any> =>
                    Promise.resolve({
                        ok: true,
                        something: 'something'
                    })
                )

                await fetchChromeZipFile(url)

                expect(onMock).toHaveBeenCalledTimes(1)
                expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

                const callback = onMock.mock.calls[0][1]

                callback({
                    total: 3 * 1024 * 1024,
                    progress: 0.1,
                })

                callback({
                    total: 3 * 1024 * 1024,

                })

                expect(progressMock.start).toHaveBeenCalledWith({
                    barLength: 40,
                    steps: 3,
                    unit: 'MB',
                    showNumeric: true,
                    start: 'Downloading binary...',
                    success: 'zip successfully downloaded',
                    fail: 'error'
                })
            })

            it('should continue a progress', async () => {
                const url = 'some-url'

                fetchMock.mockImplementation((): Promise<any> =>
                    Promise.resolve({
                        ok: true,
                        something: 'something'
                    })
                )

                await fetchChromeZipFile(url)

                expect(onMock).toHaveBeenCalledTimes(1)
                expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

                const callback = onMock.mock.calls[0][1]

                callback({
                    total: 3 * 1024 * 1024,
                    progress: 0.1,
                })

                callback({
                    total: 3 * 1024 * 1024,
                    progress: 0.3,
                })

                expect(progressMock.fraction).toHaveBeenCalledWith(0.3)
            })

        })
    })
})
