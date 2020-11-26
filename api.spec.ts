import { mocked } from 'ts-jest/utils'
import { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'
import * as fetch  from 'node-fetch'

import { logger, LoggerSpinner } from './loggerSpinner'
import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile, fetchLocalStore } from './api'

jest.mock('node-fetch', () => jest.fn())
jest.mock('./loggerSpinner')

describe('api', () => {

    let loggerMock: MaybeMockedDeep<LoggerSpinner>
    let fetchMock: MaybeMocked<any>

    beforeEach(() => {
        fetchMock = mocked(fetch)
        mocked<any>(fetch).mockClear()
        loggerMock = mocked(logger, true)
    })

    describe('fetchLocalStore', () => {
        it('should return the formatted store file as text', async () => {
            const url = 'local-store-url'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({some: "store"})
                    }
                })
            )

            expect(await fetchLocalStore(url)).toEqual(
`{
  "some": "store"
}`)
            expect(fetchMock.mock.calls.length).toBe(1);
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

            try {
                await fetchLocalStore(url)
            } catch (error) {
                expect(fetchMock.mock.calls.length).toBe(1);
                expect(fetch).toHaveBeenCalledWith(url)
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
        })
    })

    describe('fetchChromiumTags', () => {
        it('should fetch chromium tags as text' , async () => {
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
            expect(fetchMock.mock.calls.length).toBe(1);
        })

        it('should throw an error on non-ok http response', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                    })
            )

            try {
                await fetchChromiumTags()
            } catch(error) {
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
        })
    })

    describe('fetchBranchPosition', () => {
        it('should fetch the branch position', async () => {
            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    json() {
                        return Promise.resolve({chromium_base_position: 3})
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

            try {
                await fetchChromiumTags()
            } catch(error) {
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
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
            expect(loggerMock.success).toHaveBeenCalledTimes(1)
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

            try {
                await fetchChromeUrl('', '', '')
            } catch (error) {
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
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
            const filename = 'some-filename'

            fetchMock.mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            try {
                await fetchChromeZipFile(url)
            } catch(error) {
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
        })
    })
})
