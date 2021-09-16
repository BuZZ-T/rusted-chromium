import { existsSync, readFile, writeFile } from 'fs'
import * as path from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { IStoreConfig, Store } from '../interfaces'
import { createStore, ReadFileWithOptions } from '../test.utils'
import { downloadStore } from './downloadStore'
import { importAndMergeLocalstore } from './importStore'
import { readStoreFile } from './readStore'

jest.mock('fs')
jest.mock('../log/spinner')
jest.mock('./downloadStore')
jest.mock('./readStore')

describe('importStore', () => {
    describe('importAndMergeLocalstore', () => {

        let existsSyncMock: MaybeMocked<typeof existsSync>
        let writeFileMock: MaybeMocked<typeof writeFile>
        let readFileMock: MaybeMocked<ReadFileWithOptions>
        
        let downloadStoreMock: MaybeMocked<typeof downloadStore>
        let readStoreFileMock: MaybeMocked<typeof readStoreFile>

        beforeAll(() => {
            downloadStoreMock = mocked(downloadStore)
            readStoreFileMock = mocked(readStoreFile)

            existsSyncMock = mocked(existsSync)
            writeFileMock = mocked(writeFile)
            readFileMock = mocked(readFile as ReadFileWithOptions)
        })

        beforeEach(() => {
            downloadStoreMock.mockReset()
            readStoreFileMock.mockReset()

            existsSyncMock.mockClear()
            writeFileMock.mockClear()
            readFileMock.mockClear()
        })

        it('should download a store via URL and store it without existing store', async () => {
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })

            existsSyncMock.mockReturnValue(false)
            downloadStoreMock.mockReturnValue(Promise.resolve(anyStore))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(anyStore, null, 2), expect.any(Function))
        })

        it('should download a store via local file and store it without existing store', async () => {
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })

            existsSyncMock.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(anyStore))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(anyStore, null, 2), expect.any(Function))
        })

        it('should do nothing, if no store is downloaded', async () => {
            existsSyncMock.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(null as unknown as Store))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            await expect(() => importAndMergeLocalstore(config)).rejects.toBe(undefined)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(0)
        })

        it('should do nothing, if no store file is loaded from file system', async () => {
            existsSyncMock.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(null as unknown as Store))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            await expect(() => importAndMergeLocalstore(config)).rejects.toBe(undefined)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(0)
        })

        it('should merge the existing file with the file downloaded by URL', async () => {
            const existingStore = createStore({ linux: { x64: ['1.0.0.0'], x86: [] }, win: { x64: ['2.0.0.0'], x86: [] } })
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })
            const mergedStore = createStore({
                linux: {
                    x64: ['1.0.0.0', '10.11.12.13'],
                    x86: []
                },
                win: {
                    x64: ['2.0.0.0'],
                    x86: []
                }
            })

            existsSyncMock.mockReturnValue(true)
            readFileMock.mockImplementation((file, options, callback) => {
                callback(null, JSON.stringify(existingStore, null, 2))
            })
            downloadStoreMock.mockReturnValue(Promise.resolve(anyStore))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(mergedStore, null, 2), expect.any(Function))
        })

        it('should merge the existing file with the file downloaded by local file', async () => {
            const existingStore = createStore({ linux: { x64: ['1.0.0.0'], x86: [] }, win: { x64: ['2.0.0.0'], x86: [] } })
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })
            const mergedStore = createStore({
                linux: {
                    x64: ['1.0.0.0', '10.11.12.13'],
                    x86: []
                },
                win: {
                    x64: ['2.0.0.0'],
                    x86: []
                }
            })

            existsSyncMock.mockReturnValue(true)
            readFileMock.mockImplementation((file, options, callback) => {
                callback(null, JSON.stringify(existingStore, null, 2))
            })
            readStoreFileMock.mockReturnValue(Promise.resolve(anyStore))
            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(mergedStore, null, 2), expect.any(Function))
        })
    })
})
