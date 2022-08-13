/**
 * Integration tests for downloading chromium
 * 
 * @group int/use-case/downloadChromium
 */

import { readFile, writeFile, unlink } from 'fs/promises'
/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { join as pathJoin, resolve } from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { MappedVersion } from '../commons/MappedVersion'
import type { IListStore } from '../interfaces/store.interfaces'
import { rusted } from '../rusted'
import { mockNodeFetch, chromeZipStream, branchPositionResponse, getJestTmpFolder, minimalValidZipfile } from '../test/int.utils'
import { createStore } from '../test/test.utils'
import { popArray } from '../utils'
import { existsAndIsFile, existsAndIsFolder } from '../utils/file.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] download chromium', () => {
    const chromeZip10 = pathJoin(__dirname, '../', 'chrome-linux-x64-10.0.0.0.zip')
    const chromeZip20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0.zip')
    // TODO: why no "../" here?
    const chromeFolder20 = pathJoin(__dirname, 'chrome-linux-x64-20.0.0.0')
    const localStoreFile = pathJoin(__dirname, '../', 'localstore.json')

    let promptsMock: MaybeMocked<typeof prompts>
    let nodeFetchMock: MaybeMocked<typeof fetch>

    beforeAll(async () => {
        promptsMock = mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            '../localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            './node_modules': mockFs.load(resolve(__dirname, '../node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(resolve(`/tmp/${jestFolder}`)),
        })
    })

    beforeEach(async () => {
        // clear mock-fs
        await writeFile(localStoreFile, JSON.stringify(createStore()))
        if (await existsAndIsFile(chromeZip10)) {
            await unlink(chromeZip10)
        }
        if (await existsAndIsFile(chromeZip20)) {
            await unlink(chromeZip20)
        }

        nodeFetchMock = mocked(fetch)
        mockNodeFetch(nodeFetchMock, {
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

        expect(await existsAndIsFile(chromeZip10)).toBe(true)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should write the received data in the zip file and complete', async () => {
        const data = 'some-data-foor-zip'

        mockNodeFetch(nodeFetchMock, {
            config: {
                chromeZip: {
                    contentLength: data.length,
                }
            }
        })

        promptsMock.mockReturnValue({ version: '10.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--max-results=1'], 'linux')

        chromeZipStream.push(data)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)

        await expect(readFile(chromeZip10, { encoding: 'utf-8' })).resolves.toEqual(data)
    })

    it('should select and download a version', async () => {
        mockNodeFetch(nodeFetchMock, {
            params: {
                tags: ['10.0.0.0', '20.0.0.0']
            }
        })
        promptsMock.mockReturnValue({ version: '20.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(true)

        expect(promptsMock).toHaveBeenCalledTimes(1)
        expect(promptsMock).toHaveBeenCalledWith({
            choices: [
                new MappedVersion({
                    major: 20,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
                new MappedVersion({
                    major: 10,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            ],
            hint: 'for linux x64',
            message: 'Select a version',
            name: 'version',
            type: 'select',
            warn: 'This version seems to not have a binary',
        })
    })

    it('should select, download and extract a version', async () => {
        mockNodeFetch(nodeFetchMock, {
            params: {
                tags: ['10.0.0.0', '20.0.0.0']
            },
            config: {
                chromeZip: {
                    contentLength: minimalValidZipfile.length,
                }
            }
        })
        promptsMock.mockReturnValue({ version: '20.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--unzip'], 'linux')

        chromeZipStream.push(minimalValidZipfile)
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFolder(chromeFolder20)).toBe(true)
        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)

        expect(promptsMock).toHaveBeenCalledTimes(1)
        expect(promptsMock).toHaveBeenCalledWith({
            choices: [
                new MappedVersion({
                    major: 20,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
                new MappedVersion({
                    major: 10,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            ],
            hint: 'for linux x64',
            message: 'Select a version',
            name: 'version',
            type: 'select',
            warn: 'This version seems to not have a binary',
        })
    })

    it('should mark a chrome version as disabled, on no binary found', async () => {
        mockNodeFetch(nodeFetchMock, {
            params: {
                branchPosition: '4444',
            }
        })
        promptsMock.mockReturnValue({ version: '10.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')
        chromeZipStream.end()
        await rustedPromise 

        expect(await existsAndIsFile(chromeZip10)).toBe(false)

        const storedStore = await readFile(localStoreFile, { encoding: 'utf-8' })
        const store: IListStore = JSON.parse(storedStore)

        expect(store.linux.x64).toEqual(['10.0.0.0'])
        expect(store.linux.x86).toEqual([])
        expect(store.win.x64).toEqual([])
        expect(store.win.x86).toEqual([])
        expect(store.mac.x64).toEqual([])
        expect(store.mac.arm).toEqual([])
    })

    it('should mark a chrome version as disabled, on no binary found and init with an empty store on no store file found', async () => {
        await unlink(localStoreFile)
        mockNodeFetch(nodeFetchMock, {
            params: {
                branchPosition: '4444',
            }
        })
        promptsMock.mockReturnValue({ version: '10.0.0.0' })

        expect(await existsAndIsFile(localStoreFile)).toBe(false)

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')
        chromeZipStream.end()
        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(localStoreFile)).toBe(true)

        const storedStore = await readFile(localStoreFile, { encoding: 'utf-8' })
        const store: IListStore = JSON.parse(storedStore)

        expect(store.linux.x64).toEqual(['10.0.0.0'])
        expect(store.linux.x86).toEqual([])
        expect(store.win.x64).toEqual([])
        expect(store.win.x86).toEqual([])
        expect(store.mac.x64).toEqual([])
        expect(store.mac.arm).toEqual([])
    })

    it('should mark a chrome version as disabled, on no binary found and init with an empty store on currupt JSON', async () => {
        await writeFile(localStoreFile, '{ asdf')
        mockNodeFetch(nodeFetchMock, {
            params: {
                branchPosition: '4444',
            }
        })
        promptsMock.mockReturnValue({ version: '10.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')
        
        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(localStoreFile)).toBe(true)

        const storedStore = await readFile(localStoreFile, { encoding: 'utf-8' })
        const store: IListStore = JSON.parse(storedStore)

        expect(store.linux.x64).toEqual(['10.0.0.0'])
        expect(store.linux.x86).toEqual([])
        expect(store.win.x64).toEqual([])
        expect(store.win.x86).toEqual([])
        expect(store.mac.x64).toEqual([])
        expect(store.mac.arm).toEqual([])
    })

    it('should decrease on fail', async () => {
        const gen = popArray(['4444'])

        mockNodeFetch(nodeFetchMock, {
            params: {
                tags: ['20.0.0.0', '10.0.0.0']
            },
            urls: [
                {
                    once: true,
                    name: 'branchPosition',
                    gen: () => gen.next(),
                    mock: (position: string) => branchPositionResponse(position),
                }
            ]
        })
        promptsMock.mockReturnValueOnce({ version: '20.0.0.0' })
        promptsMock.mockReturnValue({ version: '10.0.0.0' })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--decrease-on-fail'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(await existsAndIsFile(chromeZip20)).toBe(false)
        expect(await existsAndIsFile(chromeZip10)).toBe(true)
    })

    it('should increase on fail', async () => {
        const gen = popArray(['4444'])

        mockNodeFetch(nodeFetchMock, {
            params: {
                tags: ['20.0.0.0', '10.0.0.0']
            },
            urls: [
                {
                    once: true,
                    name: 'branchPosition',
                    gen: () => gen.next(),
                    mock: (position: string) => branchPositionResponse(position),
                }
            ]
        })
        promptsMock.mockReturnValueOnce({ version: '10.0.0.0' })
        promptsMock.mockReturnValue({ version: '20.0.0.0' })

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
                tags: ['30.0.0.0', '20.0.0.1', '20.0.0.0', '10.0.3.0', '10.0.0.0']
            },
            urls: [
                {
                    once: true,
                    name: 'branchPosition',
                    gen: () => gen.next(),
                    mock: (position: string) => branchPositionResponse(position),
                }
            ]
        })
        promptsMock.mockReturnValue({ version: '20.0.0.0' })

        const rustedPromsie = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--only-newest-major'], 'linux')

        chromeZipStream.end()

        await rustedPromsie

        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            // FIXME: Check missing warn field in PromptObject
            warn: 'This version seems to not have a binary',
            choices: [new MappedVersion('30.0.0.0', false), new MappedVersion('20.0.0.1', false), new MappedVersion('10.0.3.0', false)],
            hint: expect.any(String),
        })
    })
})
