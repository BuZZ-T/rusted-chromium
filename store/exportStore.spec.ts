/**
 * Tests exportStore file
 * 
 * @group unit/file/store/exportStore
 */

import { existsSync, createReadStream, ReadStream } from 'fs'
import { join } from 'path'
import type { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { createExportConfig } from '../test/test.utils'
import { exportStore } from './exportStore'

jest.mock('fs')

describe('exportStore', () => {

    let existsSyncMock: MaybeMocked<typeof existsSync>
    let createReadStreamMock: MaybeMocked<typeof createReadStream>
    let readStreamMock: MaybeMockedDeep<ReadStream>

    beforeAll(() => {
        existsSyncMock = mocked(existsSync)
        createReadStreamMock = mocked(createReadStream)
        readStreamMock = {
            pipe: jest.fn()
        } as unknown as MaybeMockedDeep<ReadStream>
    })

    beforeEach(() => {
        existsSyncMock.mockClear()
        createReadStreamMock.mockClear()
        readStreamMock.pipe.mockClear()
    })

    describe('exportStore', () => {
        it('should pipe to stdout for the default path', () => {
            existsSyncMock.mockReturnValue(true)
            createReadStreamMock.mockReturnValue(readStreamMock)

            exportStore(createExportConfig({ path: undefined }))

            expect(createReadStreamMock).toHaveBeenCalledTimes(1)
            expect(createReadStreamMock).toHaveBeenCalledWith(join(__dirname, '..', LOCAL_STORE_FILE))
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(1)
            expect(readStreamMock.pipe).toHaveBeenCalledWith(process.stdout)
        })

        it('should pipe to stdout with a given path', () => {
            existsSyncMock.mockReturnValue(true)
            createReadStreamMock.mockReturnValue(readStreamMock)

            exportStore(createExportConfig({ path: 'some_path' }))

            expect(createReadStreamMock).toHaveBeenCalledTimes(1)
            expect(createReadStreamMock).toHaveBeenCalledWith('some_path')
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(1)
            expect(readStreamMock.pipe).toHaveBeenCalledWith(process.stdout)
        })

        it('should throw if the default path does not exist', () => {
            existsSyncMock.mockReturnValue(false)
            createReadStreamMock.mockReturnValue(readStreamMock)

            expect(() => exportStore(createExportConfig())).toThrow('No "localstore.json" file found')

            expect(createReadStreamMock).toHaveBeenCalledTimes(0)
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(0)
        })

        it('should throw if the given path does not exist', () => {
            existsSyncMock.mockReturnValue(false)
            createReadStreamMock.mockReturnValue(readStreamMock)

            expect(() => exportStore(createExportConfig({ path: 'some_path' }))).toThrow('No "localstore.json" file found under the given path: some_path')

            expect(createReadStreamMock).toHaveBeenCalledTimes(0)
            expect(readStreamMock.pipe).toHaveBeenCalledTimes(0)
        })
    })
})
