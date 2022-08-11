/**
 * Integration tests for exporting the store
 * 
 * @group int/use-case/importStore
 */

import { readFile, writeFile } from 'fs/promises'
/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { join, resolve } from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { rusted } from './rusted'
import { Store } from './store/Store'
import { mockNodeFetch, IMockAdditional, getJestTmpFolder } from './test/int.utils'
import { createStore } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] import store', () => {

    const localStoreFile = join(__dirname, 'localstore.json')

    let promptsMock: MaybeMocked<typeof prompts>
    let nodeFetchMock: MaybeMocked<typeof fetch>

    beforeAll(async () => {

        promptsMock = mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            'localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            'node_modules': mockFs.load(resolve(__dirname, './node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(resolve(`/tmp/${jestFolder}`)),
        })
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

        expect(storedStore).toEqual(new Store(expectedStore).toMinimalFormattedString())
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

        expect(storedStore).toEqual(new Store(expectedStore).toMinimalFormattedString())
    })
})
