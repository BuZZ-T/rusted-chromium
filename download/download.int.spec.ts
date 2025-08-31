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
/* eslint-disable-next-line import/no-namespace */
import * as prompts from 'prompts'

import { ComparableVersion } from '../public_api'
import { rusted } from '../rusted'
import { mockNodeFetch, chromeZipStream, getJestTmpFolder, minimalValidZipfile } from '../test/int.utils'
import { popArray } from '../utils'
import { existsAndIsFile, existsAndIsFolder } from '../utils/file.utils'

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] download chromium', () => {
    const chromeZip10 = pathJoin(__dirname, '../', 'chrome-linux-x64-10.0.0.0.zip')
    const chromeZip20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0.zip')
    const chromeFolder20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0')

    let promptsMock: jest.MaybeMocked<typeof prompts>
    let nodeFetchMock: jest.MaybeMocked<typeof fetch>

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

        nodeFetchMock = jest.mocked(fetch)
        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['10.0.0.0', '20.0.0.0']
            },
            config: {
                chromeZip: {
                    contentLength: 20,
                }
            }
        })

        promptsMock.mockClear()
    })

    afterAll(() => {
        mockFs.restore()
    })

    it('should download a chrome file with --results=1', async () => {
        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--max-results=1'], 'linux')

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(chromeZip20)).toBe(true)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should write the received data in the zip file and complete', async () => {
        const data = 'some-data-foor-zip'

        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['10.0.0.0', '20.0.0.0']
            },
            config: {
                chromeZip: {
                    contentLength: data.length,
                }
            }
        })

        promptsMock.mockResolvedValue({ version: new ComparableVersion('10.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

        chromeZipStream.push(data)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)

        await expect(readFile(chromeZip10, { encoding: 'utf-8' })).resolves.toEqual(data)
    })

    it('should select and download a version', async () => {
        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['10.0.0.0', '20.0.0.0']
            }
        })
        promptsMock.mockResolvedValue({ version: '20.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

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
        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['10.0.0.0', '20.0.0.0']
            },
            config: {
                chromeZip: {
                    contentLength: minimalValidZipfile.length,
                }
            }
        })
        promptsMock.mockResolvedValue({ version: '20.0.0.0' })

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
        const gen = popArray(['4444'])

        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['20.0.0.0', '10.0.0.0']
            },
            urls: [
                {
                    once: true,
                    name: 'branchPosition',
                    gen: () => gen.next(),
                    mock: (position: string) => `pos. ${position}`,
                }
            ]
        })
        promptsMock.mockResolvedValueOnce({ version: '20.0.0.0' })
        promptsMock.mockResolvedValue({ version: '10.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--decrease-on-fail'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(true)
        expect(await existsAndIsFile(chromeZip10)).toBe(false)
    })

    it('should increase on fail', async () => {
        const gen = popArray(['4444'])

        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['20.0.0.0', '10.0.0.0']
            },
            urls: [
                {
                    once: true,
                    name: 'branchPosition',
                    gen: () => gen.next(),
                    mock: (position: string) => `pos. ${position}`,
                }
            ]
        })
        promptsMock.mockResolvedValueOnce({ version: '10.0.0.0' })
        promptsMock.mockResolvedValue({ version: '20.0.0.0' })

        const rustedPromsie = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--increase-on-fail'], 'linux')

        chromeZipStream.end()

        await rustedPromsie

        expect(await existsAndIsFile(chromeZip20)).toBe(true)
        expect(await existsAndIsFile(chromeZip10)).toBe(false)
    })

    it('should prompt only the newest majors', async () => {
        const gen = popArray(['4444'])

        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['30.0.0.0', '20.0.0.1', '20.0.0.0', '10.0.3.0', '10.0.0.0']
            },
        })
        promptsMock.mockResolvedValue({ version: '20.0.0.1' })

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
})
