import { mocked } from 'ts-jest/utils'
import { MaybeMockedDeep } from 'ts-jest/dist/util/testing'
import * as fetch  from 'node-fetch'

import { logger, LoggerSpinner } from './loggerSpinner'
import { fetchChromiumTags, fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile } from './api'
import { IConfig } from './interfaces'

jest.mock('node-fetch', () => jest.fn())
jest.mock('./loggerSpinner')

describe('api', () => {

    let loggerMock: MaybeMockedDeep<LoggerSpinner>

    beforeEach(() => {
        mocked(fetch).mockClear()
        loggerMock = mocked(logger, true)
    })

    describe('fetchChromiumTags', () => {
        it('should fetch chromium tags as text' , async () => {
            mocked(fetch).mockImplementation((): Promise<any> => 
                Promise.resolve({
                    ok: true,
                    text() {
                        return Promise.resolve('some-html')
                    }
                })
            )

            expect(await fetchChromiumTags()).toEqual('some-html')
            expect(fetch).toHaveBeenLastCalledWith('https://chromium.googlesource.com/chromium/src/+refs')
            expect(mocked(fetch).mock.calls.length).toBe(1);
        })

        it('should throw an error on non-ok http response', async () => {
            mocked(fetch).mockImplementation((): Promise<any> =>
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
            mocked(fetch).mockImplementation((): Promise<any> =>
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
            mocked(fetch).mockImplementation((): Promise<any> =>
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
            mocked(fetch).mockImplementation((): Promise<any> =>
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

            mocked(fetch).mockImplementation((): Promise<any> =>
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
            mocked(fetch).mockImplementation((): Promise<any> =>
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
            const filename = 'some-filename'

            mocked(fetch).mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: true,
                    something: 'something'
                })
            )

            expect((await fetchChromeZipFile(url, filename, {autoUnzip: true} as IConfig)).something).toEqual('something')
        })

        it('should throw an error on non-ok http response', async () => {
            const url = 'some-url'
            const filename = 'some-filename'

            mocked(fetch).mockImplementation((): Promise<any> =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    error: 'some-error-message',
                })
            )

            try {
                await fetchChromeZipFile(url, filename, {autoUnzip: true} as IConfig)
            } catch(error) {
                expect(error).toEqual(new Error('Status Code: 400 some-error-message'))
            }
        })
    })
})
