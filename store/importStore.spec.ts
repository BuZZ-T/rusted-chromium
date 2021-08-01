import * as fs from 'fs'
import * as path from 'path'
import { mocked } from 'ts-jest/utils'

import { importAndMergeLocalstore } from './importStore'
import { downloadStore } from './downloadStore'
import { readStoreFile } from './readStore'
import { LOCAL_STORE_FILE } from '../constants'
import { PromisifyCallback, PROMISIFY_NO_ERROR, createStore } from '../test.utils'
import { IStoreConfig } from '../interfaces'

jest.mock('fs')
jest.mock('../loggerSpinner')
jest.mock('./downloadStore')
jest.mock('./readStore')

describe('importStore', () => {
    describe('importAndMergeLocalstore', () => {

        let fsMock: any
        let downloadStoreMock: any
        let readStoreFileMock: any

        beforeEach(() => {
            downloadStoreMock = mocked(downloadStore)
            downloadStoreMock.mockReset()

            readStoreFileMock = mocked(readStoreFile)
            readStoreFileMock.mockReset()

            fsMock = mocked(fs, true)
            fsMock.existsSync.mockClear()
            fsMock.writeFile.mockClear()
            fsMock.readFile.mockClear()

        })

        it('should download a store via URL and store it without existing store', async () => {
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })

            fsMock.existsSync.mockReturnValue(false)
            downloadStoreMock.mockReturnValue(Promise.resolve(anyStore))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(fsMock.readFile).toHaveBeenCalledTimes(0)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(anyStore, null, 2), expect.any(Function))
        })

        it('should download a store via local file and store it without existing store', async () => {
            const anyStore = createStore({ linux: { x64: ['10.11.12.13'], x86: [] } })

            fsMock.existsSync.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(anyStore))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(fsMock.readFile).toHaveBeenCalledTimes(0)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(anyStore, null, 2), expect.any(Function))
        })

        it('should do nothing, if no store is downloaded', async () => {
            fsMock.existsSync.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(null))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            try {
                await importAndMergeLocalstore(config)
                fail()
            } catch(e) {
                expect(e).toBe(undefined)
            }

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(fsMock.readFile).toHaveBeenCalledTimes(0)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(0)
        })

        it('should do nothing, if no store file is loaded from file system', async () => {
            fsMock.existsSync.mockReturnValue(false)
            readStoreFileMock.mockReturnValue(Promise.resolve(null))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            try {
                await importAndMergeLocalstore(config)
                fail()
            } catch(e) {
                expect(e).toBe(undefined)
            }

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(fsMock.readFile).toHaveBeenCalledTimes(0)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(0)
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

            fsMock.existsSync.mockReturnValue(true)
            fsMock.readFile.mockImplementation((file: any, options: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, JSON.stringify(existingStore, null, 2))
            })
            downloadStoreMock.mockReturnValue(Promise.resolve(anyStore))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: 'https://some.url.de' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(fsMock.readFile).toHaveBeenCalledTimes(1)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(mergedStore, null, 2), expect.any(Function))
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

            fsMock.existsSync.mockReturnValue(true)
            fsMock.readFile.mockImplementation((file: any, options: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, JSON.stringify(existingStore, null, 2))
            })
            readStoreFileMock.mockReturnValue(Promise.resolve(anyStore))
            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            const config: IStoreConfig = { url: '/some/path/to/file' }

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(fsMock.readFile).toHaveBeenCalledTimes(1)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(__dirname, '..', LOCAL_STORE_FILE), JSON.stringify(mergedStore, null, 2), expect.any(Function))
    
        })
    })
})
