/**
 * Integration tests for exporting the store
 * 
 * @group int/use-case/exportStore
 */

/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { writeFile } from 'node:fs/promises'
import { join, resolve as pathResolve } from 'node:path'
import { PassThrough } from 'node:stream'
import type { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { rusted } from './rusted'
import { exportStore } from './store/exportStore'
import { getJestTmpFolder, mockNodeFetch } from './test/int.utils'
import { createStore, createExportConfig } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] export store', () => {

    const localStoreFile = join(__dirname, 'localstore.json')

    let promptsMock: MaybeMocked<typeof prompts>
    let nodeFetchMock: MaybeMocked<typeof fetch>

    beforeAll(async () => {

        promptsMock = mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            'localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            'node_modules': mockFs.load(pathResolve(__dirname, './node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(pathResolve(`/tmp/${jestFolder}`)),
        })
    })

    beforeEach(async () => {
        // clear mock-fs
        await writeFile(localStoreFile, JSON.stringify(createStore()))

        nodeFetchMock = mocked(fetch)
        mockNodeFetch(nodeFetchMock)

        promptsMock.mockClear()
    })

    afterAll(() => {
        mockFs.restore()
    })

    /* eslint-disable-next-line jest/expect-expect */
    it('should run without error with --export-store', async () => {
        await writeFile(localStoreFile, JSON.stringify(createStore({
            linux: {
                x64: ['20.0.0.0'],
                x86: [],
            }
        })))

        await rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--export-store'], 'linux')
    })

    it('should write the store to the provided stream', async () => {
        const expectedStore = createStore({
            linux: {
                x64: ['30.0.0.0'],
                x86: [],
            }
        })
        
        await writeFile(localStoreFile, JSON.stringify(expectedStore, null, 4))

        const pass = new PassThrough()
        exportStore(createExportConfig(), pass as unknown as NodeJS.WriteStream)

        return new Promise<void>(resolve => {
            pass.on('data', data => {
                expect(data.toString()).toEqual(JSON.stringify(expectedStore, null, 4))
                resolve()
            })
        })
    })
})
