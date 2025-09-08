/**
 * Integration tests for downloading chromium
 *
 * @group int/use-case/downloadChromium
 */

/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { readFile, unlink } from 'node:fs/promises'
import { join as pathJoin, resolve } from 'node:path'
import { PassThrough } from 'node:stream'
/* eslint-disable-next-line import/no-namespace */
import * as prompts from 'prompts'

import { ComparableVersion } from '../public_api'
import { rusted } from '../rusted'
import { createFetchMockImplementation, getJestTmpFolder, KnownUrls, minimalValidZipfile } from '../test/int.utils'
import { createApiRelease } from '../test/test.utils'
import { existsAndIsFile, existsAndIsFolder } from '../utils/file.utils'

jest.mock('node-fetch')
const nodeFetchMock = jest.mocked(fetch)

jest.mock('prompts')

describe('[int] download chromium', () => {
    const chromeZip10 = pathJoin(__dirname, '../', 'chrome-linux-x64-10.0.0.0.zip')
    const chromeZip20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0.zip')
    const chromeFolder20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0')

    let promptsMock: jest.MaybeMocked<typeof prompts>

    beforeAll(async () => {
        promptsMock = jest.mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            // pass some folders to the mock for jest to be able to run
            './node_modules': mockFs.load(resolve(__dirname, '../node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(resolve(`/tmp/${jestFolder}`)),
        })
    })

    beforeEach(async () => {
        // clear mock-fs
        if (await existsAndIsFile(chromeZip10)) {
            await unlink(chromeZip10)
        }
        if (await existsAndIsFile(chromeZip20)) {
            await unlink(chromeZip20)
        }

        promptsMock.mockClear()
        nodeFetchMock.mockClear()
    })

    afterAll(() => {
        mockFs.restore()
    })

    it('should download a chrome file with --results=1', async () => {
        const branchPosition = 1234

        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'})],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--max-results=1'], 'linux')

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await rustedPromise

        expect(nodeFetchMock).toHaveBeenCalledTimes(3)
        expect(nodeFetchMock).toHaveBeenCalledWith('https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Linux&num=100&offset=0')
        expect(nodeFetchMock).toHaveBeenCalledWith(`https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=Linux_x64/${branchPosition}/&fields=items(mediaLink,name)`)
        expect(nodeFetchMock).toHaveBeenCalledWith('https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media')

        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(chromeZip20)).toBe(true)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should write the received data in the zip file and complete', async () => {
        const data = 'some-data-foor-zip'
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: 0, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        promptsMock.mockResolvedValue({ version: new ComparableVersion('10.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

        chromeZipStream.push(data)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)

        await expect(readFile(chromeZip10, { encoding: 'utf-8' })).resolves.toEqual(data)
    })

    it('should select and download a version', async () => {
        const data = 'some-data-foor-zip'
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: 0, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

        chromeZipStream.push(data)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(true)

        const expectedChoices: prompts.Choice[] = [
            {
                title: '20.0.0.0',
                value: new ComparableVersion('20.0.0.0'),
                disabled: false
            },
            {
                title: '10.0.0.0',
                value: new ComparableVersion('10.0.0.0'),
                disabled: false
            }
        ]

        expect(promptsMock).toHaveBeenCalledTimes(1)
        expect(promptsMock).toHaveBeenCalledWith({
            choices: expectedChoices,
            hint: 'for linux x64',
            message: 'Select a version',
            name: 'version',
            warn: 'This version seems to not have a binary',
            type: 'select',

        })
    })

    it('should select, download and extract a version', async () => {
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: 0, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': minimalValidZipfile.length,
                }
            }
        ]))
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--unzip'], 'linux')

        chromeZipStream.push(minimalValidZipfile)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFolder(chromeFolder20)).toBe(true)
        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)

        const expectedChoices: prompts.Choice[] = [
            {
                title: '20.0.0.0',
                value: new ComparableVersion('20.0.0.0'),
                disabled: false
            },
            {
                title: '10.0.0.0',
                value: new ComparableVersion('10.0.0.0'),
                disabled: false
            }
        ]

        expect(promptsMock).toHaveBeenCalledTimes(1)
        expect(promptsMock).toHaveBeenCalledWith({
            choices: expectedChoices,
            hint: 'for linux x64',
            message: 'Select a version',
            name: 'version',
            type: 'select',
            warn: 'This version seems to not have a binary',
        })
    })

    it('should decrease on fail', async () => {
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: 0, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--decrease-on-fail'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(false)
        expect(await existsAndIsFile(chromeZip10)).toBe(true)
    })

    it('should increase on fail', async () => {
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: 0, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        promptsMock.mockResolvedValueOnce({ version: new ComparableVersion('10.0.0.0') })
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--increase-on-fail'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(true)
        expect(await existsAndIsFile(chromeZip10)).toBe(false)
    })

    it('should prompt only the newest majors', async () => {
        const branchPosition = 1234
        const chromeZipStream = new PassThrough()

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '30.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.1'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '10.0.3.0'}),
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '10.0.0.0'}),
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                response: {
                    kind: 'response-kind',
                    items: [
                        {
                            name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                            mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                        }
                    ],
                },
                stringify: true,
            },
            {
                url: KnownUrls.chromeZip,
                response: chromeZipStream,
                responseHeader: {
                    'content-length': '20',
                }
            }
        ]))

        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.1') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--only-newest-major'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        const expectedChoices: prompts.Choice[] = [
            {
                title: '30.0.0.0',
                value: new ComparableVersion('30.0.0.0'),
                disabled: false
            },
            {
                title: '20.0.0.1',
                value: new ComparableVersion('20.0.0.1'),
                disabled: false
            },
            {
                title: '10.0.3.0',
                value: new ComparableVersion('10.0.3.0'),
                disabled: false
            }
        ]

        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            // FIXME: Check missing warn field in PromptObject
            warn: 'This version seems to not have a binary',
            choices: expectedChoices,
            hint: expect.any(String),
        })
    })

    it('should not download when --no-download is set', async () => {
        const branchPosition = 1234

        nodeFetchMock.mockImplementation(createFetchMockImplementation([
            {
                url: KnownUrls.releases,
                response: [
                    createApiRelease({ chromium_main_branch_position: branchPosition, version: '20.0.0.0'}),
                    createApiRelease({ chromium_main_branch_position: 0, version: '10.0.0.0'})
                ],
                stringify: true,
            },
            {
                url: KnownUrls.chromeUrl,
                responses: [
                    {
                        kind: 'response-kind',
                        items: [
                            {
                                name: `Linux_x64/${branchPosition}/chrome-linux.zip`,
                                mediaLink: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F0%2Fchrome-linux-x64.zip?generation=1234567890&alt=media',
                            }
                        ],
                    },
                    {
                        kind: 'response-kind',
                        items: []
                    }
                ],
                stringify: true,
            },
        ]))

        await rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--no-download', '--max-results=1'], 'linux')

        expect(nodeFetchMock).toHaveBeenCalledTimes(3)
        expect(nodeFetchMock).toHaveBeenCalledWith('https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Linux&num=100&offset=0')
        expect(nodeFetchMock).toHaveBeenCalledWith( 'https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=Linux_x64/1234/&fields=items(mediaLink,name)')

    })
})
