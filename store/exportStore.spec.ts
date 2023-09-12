/**
 * Tests exportStore file
 * 
 * @group unit/file/store/exportStore
 */

import { createReadStream, ReadStream } from 'node:fs'
import { join } from 'node:path'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { logger, Logger, DebugMode } from '../log/logger'
import { createExportConfig } from '../test/test.utils'
import { existsAndIsFile } from '../utils/file.utils'
import { exportStore } from './exportStore'

jest.mock('node:fs')

jest.mock('../log/logger')
jest.mock('../utils/file.utils')

describe('exportStore', () => {

    let existsAndIsFileMock: jest.MaybeMocked<typeof existsAndIsFile>
    let createReadStreamMock: jest.MaybeMocked<typeof createReadStream>
    let readStreamMock: jest.MaybeMocked<ReadStream>
    let writeStreamMock: jest.MaybeMocked<NodeJS.WriteStream>

    let loggerMock: jest.MaybeMockedDeep<Logger>

    beforeAll(() => {
        existsAndIsFileMock = jest.mocked(existsAndIsFile)
        createReadStreamMock = jest.mocked(createReadStream)
        readStreamMock = {
            pipe: jest.fn()
        } as unknown as jest.MaybeMocked<ReadStream>
        writeStreamMock = {
            write: jest.fn()
        } as unknown as jest.MaybeMocked<NodeJS.WriteStream>

        loggerMock = jest.mocked(logger)
    })

    beforeEach(() => {
        existsAndIsFileMock.mockClear()
        createReadStreamMock.mockClear()
        readStreamMock.pipe.mockClear()
    })

    describe('exportStore', () => {
        it('should pipe to stdout for the default path', async () => {
            existsAndIsFileMock.mockResolvedValue(true)
            createReadStreamMock.mockReturnValue(readStreamMock)

            await exportStore(createExportConfig({ path: undefined }), writeStreamMock)

            expect(createReadStreamMock).toHaveBeenCalledTimes(1)
            expect(createReadStreamMock).toHaveBeenCalledWith(join(__dirname, '..', LOCAL_STORE_FILE))
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(1)
            expect(readStreamMock.pipe).toHaveBeenCalledWith(writeStreamMock)
        })

        it('should pipe to stdout with a given path', async () => {
            existsAndIsFileMock.mockResolvedValue(true)
            createReadStreamMock.mockReturnValue(readStreamMock)

            await exportStore(createExportConfig({ path: 'some_path' }), writeStreamMock)

            expect(createReadStreamMock).toHaveBeenCalledTimes(1)
            expect(createReadStreamMock).toHaveBeenCalledWith('some_path')
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(1)
            expect(readStreamMock.pipe).toHaveBeenCalledWith(writeStreamMock)
        })

        it('should throw if the default path does not exist', async () => {
            existsAndIsFileMock.mockResolvedValue(false)
            createReadStreamMock.mockReturnValue(readStreamMock)

            await expect(() => exportStore(createExportConfig(), writeStreamMock)).rejects.toEqual(new Error('No "localstore.json" file found'))

            expect(createReadStreamMock).toHaveBeenCalledTimes(0)
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(0)
        })

        it('should throw if the given path does not exist', async () => {
            existsAndIsFileMock.mockResolvedValue(false)
            createReadStreamMock.mockReturnValue(readStreamMock)

            await expect(() => exportStore(createExportConfig({ path: 'some_path' }), writeStreamMock)).rejects.toEqual(new Error('No "localstore.json" file found under the given path: some_path'))

            expect(createReadStreamMock).toHaveBeenCalledTimes(0)
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(0)
        })

        it('should enable debugging on config.debug', async () => {
            existsAndIsFileMock.mockResolvedValue(true)
            createReadStreamMock.mockReturnValue(readStreamMock)

            await exportStore(createExportConfig({ debug: true, path: 'some_path' }), writeStreamMock)

            expect(loggerMock.setDebugMode).toHaveBeenCalledTimes(1)
            expect(loggerMock.setDebugMode).toHaveBeenCalledWith(DebugMode.DEBUG)
        })
    })
})
