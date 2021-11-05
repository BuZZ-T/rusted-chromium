/**
 * Integration tests for exporting the store
 * 
 * @group int/use-case/exportStore
 */

import { writeFile as fsWriteFile } from 'fs'
import * as mockFs from 'mock-fs'
import * as fetch from 'node-fetch'
import * as path from 'path'
import { PassThrough } from 'stream'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'
import { promisify } from 'util'

import { rusted } from './rusted'
import { exportStore } from './store/exportStore'
import { getJestTmpFolder, mockNodeFetch } from './test/int.utils'
import { createStore } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] export store', () => {

    const localStoreFile = path.join(__dirname, 'localstore.json')

    let promptsMock: MaybeMocked<typeof prompts>
    let nodeFetchMock: MaybeMocked<typeof fetch>

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

        writeFile = promisify(fsWriteFile)
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
        exportStore({}, pass as unknown as NodeJS.WriteStream)

        return new Promise<void>(resolve => {
            pass.on('data', data => {
                expect(data.toString()).toEqual(JSON.stringify(expectedStore, null, 4))
                resolve()
            })
        })
    })
})
