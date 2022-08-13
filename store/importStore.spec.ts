/**
 * Tests importStore file
 * 
 * @group unit/file/store/importtore
 */

import { readFile, writeFile } from 'fs/promises'
import { join as pathJoin } from 'path'
import type { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { logger, DebugMode, Logger } from '../log/logger'
import { createStore, createImportConfig } from '../test/test.utils'
import { existsAndIsFile } from '../utils/file.utils'
import { downloadStore } from './downloadStore'
import { importAndMergeLocalstore } from './importStore'
import { readStoreFile } from './readStore'
import { Store } from './Store'

jest.mock('fs/promises')

jest.mock('../utils/file.utils')
jest.mock('../log/spinner')
jest.mock('./downloadStore')
jest.mock('./readStore')
jest.mock('../log/logger')

describe('importStore', () => {
    describe('importAndMergeLocalstore', () => {

        let existsAndIsFileMock: MaybeMocked<typeof existsAndIsFile>
        let writeFileMock: MaybeMocked<typeof writeFile>
        let readFileMock: MaybeMocked<typeof readFile>

        let downloadStoreMock: MaybeMocked<typeof downloadStore>
        let readStoreFileMock: MaybeMocked<typeof readStoreFile>

        let loggerMock: MaybeMockedDeep<Logger>

        beforeAll(() => {
            downloadStoreMock = mocked(downloadStore)
            readStoreFileMock = mocked(readStoreFile)

            existsAndIsFileMock = mocked(existsAndIsFile)
            writeFileMock = mocked(writeFile)
            readFileMock = mocked(readFile)

            loggerMock = mocked(logger, true)
        })

        beforeEach(() => {
            downloadStoreMock.mockReset()
            readStoreFileMock.mockReset()

            existsAndIsFileMock.mockClear()
            writeFileMock.mockClear()
            readFileMock.mockClear()

            loggerMock.setDebugMode.mockReset()
        })

        it('should download a store via URL and store it without existing store', async () => {
            const anyStore = new Store(createStore({ linux: { x64: ['10.11.12.13'], x86: [] } }))

            existsAndIsFileMock.mockResolvedValue(false)
            downloadStoreMock.mockResolvedValue(anyStore)

            const config = createImportConfig({ url: 'https://some.url.de' })

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(pathJoin(__dirname, '..', LOCAL_STORE_FILE), anyStore.toMinimalFormattedString())
        })

        it('should download a store via local file and store it without existing store', async () => {
            const anyStore = new Store(createStore({ linux: { x64: ['10.11.12.13'], x86: [] } }))

            existsAndIsFileMock.mockResolvedValue(false)
            readStoreFileMock.mockResolvedValue(anyStore)

            const config = createImportConfig({ url: '/some/path/to/file' })

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(pathJoin(__dirname, '..', LOCAL_STORE_FILE), anyStore.toMinimalFormattedString())
        })

        it('should do nothing, if no store file is loaded from file system', async () => {
            existsAndIsFileMock.mockResolvedValue(false)
            readStoreFileMock.mockRejectedValue(undefined)

            const config = createImportConfig({ url: '/some/path/to/file' })

            await expect(() => importAndMergeLocalstore(config)).rejects.toBe(undefined)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(0)
        })

        it('should do nothing, if no store is downloaded', async () => {
            existsAndIsFileMock.mockResolvedValue(false)
            downloadStoreMock.mockRejectedValue(undefined)

            const config = createImportConfig({ url: 'https://some.url.de' })

            await expect(() => importAndMergeLocalstore(config)).rejects.toBe(undefined)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(0)

            expect(writeFileMock).toHaveBeenCalledTimes(0)
        })

        it('should merge the existing file with the file downloaded by URL', async () => {
            const existingStore = createStore({ linux: { x64: ['1.0.0.0'], x86: [] }, win: { x64: ['2.0.0.0'], x86: [] } })
            const anyStore = new Store(createStore({ linux: { x64: ['10.11.12.13'], x86: [] } }))
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

            existsAndIsFileMock.mockResolvedValue(true)
            readFileMock.mockResolvedValue(JSON.stringify(existingStore, null, 4))
            downloadStoreMock.mockResolvedValue(anyStore)

            const config = createImportConfig({ url: 'https://some.url.de' })

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(0)
            expect(downloadStoreMock).toHaveBeenCalledTimes(1)
            expect(downloadStoreMock).toHaveBeenCalledWith(config, LOCAL_STORE_FILE)

            expect(readFileMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(pathJoin(__dirname, '..', LOCAL_STORE_FILE), new Store(mergedStore).toMinimalFormattedString())
        })

        it('should merge the existing file with the file downloaded by local file', async () => {
            const existingStore = createStore({ linux: { x64: ['1.0.0.0'], x86: [] }, win: { x64: ['2.0.0.0'], x86: [] } })
            const anyStore = new Store(createStore({ linux: { x64: ['10.11.12.13'], x86: [] } }))
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

            existsAndIsFileMock.mockResolvedValue(true)
            readFileMock.mockResolvedValue(JSON.stringify(existingStore, null, 2))
            readStoreFileMock.mockResolvedValue(anyStore)

            const config = createImportConfig({ url: '/some/path/to/file' })

            await importAndMergeLocalstore(config)

            expect(readStoreFileMock).toHaveBeenCalledTimes(1)
            expect(readStoreFileMock).toHaveBeenCalledWith(config)
            expect(downloadStoreMock).toHaveBeenCalledTimes(0)

            expect(readFileMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(pathJoin(__dirname, '..', LOCAL_STORE_FILE), new Store(mergedStore).toMinimalFormattedString())
        })

        it('should enable debugging on config.debug', async () => {
            const anyStore = new Store(createStore({ linux: { x64: ['10.11.12.13'], x86: [] } }))

            existsAndIsFileMock.mockResolvedValue(false)
            downloadStoreMock.mockResolvedValue(anyStore)

            const config = createImportConfig({ debug: true, url: 'https://some.url.de' })

            await importAndMergeLocalstore(config)

            expect(loggerMock.setDebugMode).toHaveBeenCalledTimes(1)
            expect(loggerMock.setDebugMode).toHaveBeenCalledWith(DebugMode.DEBUG)
        })
    })
})
