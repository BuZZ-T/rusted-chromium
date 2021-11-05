/**
 * Integration tests for exporting the store
 * 
 * @group int/use-case/importStore
 */

import { readFile as fsReadFile, writeFile as fsWriteFile } from 'fs'
import * as mockFs from 'mock-fs'
import * as fetch from 'node-fetch'
import * as path from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'
import { promisify } from 'util'

import { rusted } from './rusted'
import { mockNodeFetch, IMockAdditional, getJestTmpFolder } from './test/int.utils'
import { createStore } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] import store', () => {

    const localStoreFile = path.join(__dirname, 'localstore.json')

    let promptsMock: MaybeMocked<typeof prompts>
    let nodeFetchMock: MaybeMocked<typeof fetch>

    let readFile: typeof fsReadFile.__promisify__
    let writeFile: typeof fsWriteFile.__promisify__

    beforeAll(async () => {

        promptsMock = mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            'localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            'node_modules': mockFs.load(path.resolve(__dirname, './node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(path.resolve(`/tmp/${jestFolder}`)),
        })

        readFile = promisify(fsReadFile)
        writeFile = promisify(fsWriteFile)
    })

    beforeEach(async () => {
        // clear mock-fs
        await writeFile(localStoreFile, JSON.stringify(createStore()), { encoding: 'utf-8' })

        nodeFetchMock = mocked(fetch)
        mockNodeFetch(nodeFetchMock)

        promptsMock.mockClear()
    })

    afterAll(() => {
        mockFs.restore()
    })

    it('should import by File', async () => {
        const tmpFile = '/tmp/local-store'

        const expectedStore = createStore({
            linux: {
                x64: ['50.0.0.0'],
                x86: [],
            }
        })

        await writeFile(tmpFile, JSON.stringify(expectedStore))

        await rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--import-store', tmpFile], 'linux')

        const storedStore = await readFile(localStoreFile, { encoding: 'utf-8' })

        expect(storedStore).toEqual(JSON.stringify(expectedStore, null, 4))
    })

    it('should import by URL', async () => {
        const url = 'http://example.com/some/path'

        const expectedStore = createStore({
            linux: {
                x64: ['50.0.0.0'],
                x86: [],
            }
        })

        const additionalMock: IMockAdditional = {
            once: false,
            url,
            mock: () => JSON.stringify(expectedStore),
        }

        mockNodeFetch(nodeFetchMock, { urls: [additionalMock] })

        await rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--import-store', url], 'linux')

        const storedStore = await readFile(localStoreFile, { encoding: 'utf-8' })

        expect(storedStore).toEqual(JSON.stringify(expectedStore, null, 4))
    })
})
