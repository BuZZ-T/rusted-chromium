/**
 * Tests api file
 *
 * @group unit/file/api
 */

import { fetchChromeUrl, fetchChromeZipFile } from './api'
import type { IOSSettings } from './interfaces/os.interfaces'
import type { Spinner } from './log/spinner'
import { spinner } from './log/spinner'
import type { Release } from './releases/release.types'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const fetch = require('node-fetch')

const onMock = jest.fn()

jest.mock('node-fetch', () => jest.fn())
jest.mock('node-fetch-progress', () => jest.fn(() => ({
    on: onMock,
})))
jest.mock('./log/spinner')

describe('api', () => {

    let spinnerMock: jest.MaybeMockedDeep<Spinner>
    let fetchMock: jest.MaybeMocked<typeof fetch>

    beforeAll(() => {
        fetchMock = jest.mocked(fetch)
        spinnerMock = jest.mocked(spinner)
    })

    beforeEach(() => {
        onMock.mockReset()
        fetchMock.mockClear()

        spinnerMock.start.mockClear()
        spinnerMock.success.mockClear()
        spinnerMock.error.mockClear()
    })

    describe('fetchChromeUrl', () => {
        it('should fetch the chrome url', async () => {
            const branchPosition: Release['branchPosition'] = 123
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
                                name: 'Linux_x64/123/chrome-linux.zip',
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
                url: 'some-url',
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromeUrl(0, osSettings)).rejects.toThrow(new Error('Status Code: 400 some-url some-error-message'))
        })

        it('should resolve undefined if metadata contains no items', async () => {
            const branchPosition: Release['branchPosition'] = 123
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
            const branchPosition: Release['branchPosition'] = 123
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
                url: 'some-url',
                status: 400,
                error: 'some-error-message',
            })

            await expect(() => fetchChromeZipFile(url)).rejects.toThrow(new Error('Status Code: 400 some-url some-error-message'))
        })
    })
})
