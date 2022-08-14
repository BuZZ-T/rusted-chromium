/**
 * Tests readStore file
 * 
 * @group unit/file/store/readStore
 */

import { readFile } from 'node:fs/promises'
import type { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { Spinner, spinner } from '../log/spinner'
import { createStore, createImportConfig } from '../test/test.utils'
import { existsAndIsFile } from '../utils/file.utils'
import { readStoreFile } from './readStore'
import { Store } from './Store'

jest.mock('node:fs/promises')

jest.mock('../utils/file.utils')
jest.mock('../log/spinner')

describe('readStore', () => {

    describe('readStoreFile', () => {

        let readFileMock: MaybeMocked<typeof readFile>
        let existsAndIsFileMock: MaybeMocked<typeof existsAndIsFile>
        let spinnerMock: MaybeMockedDeep<Spinner>

        beforeAll(() => {
            readFileMock = mocked(readFile)
            existsAndIsFileMock = mocked(existsAndIsFile)

            spinnerMock = mocked(spinner, true)
        })

        beforeEach(() => {
            readFileMock.mockReset()
            existsAndIsFileMock.mockClear()

            spinnerMock.start.mockClear()
            spinnerMock.success.mockClear()
            spinnerMock.error.mockClear()
        })

        it('should return the parsed store received from the file system', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)
            const expectedStore = createStore()
            readFileMock.mockResolvedValue(JSON.stringify(expectedStore, null, 4))

            expect(await readStoreFile(createImportConfig({ url }))).toEqual(new Store(expectedStore))
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledWith(url, { encoding: 'utf-8' })
        })

        it('should reject the returned Promise on file not exist on filesystem', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(false)
            const expectedStore = createStore()
            readFileMock.mockResolvedValue(JSON.stringify(expectedStore, null, 4))

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toThrow(new Error('File does not exist'))
            expect(readFileMock).toHaveBeenCalledTimes(0)
        })

        it('should throw an error on unparsable JSON', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)
            readFileMock.mockResolvedValue('{"Not parseable": "6}')

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toThrow(new Error('Unexpected end of JSON input'))
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })

        it('should throw an error on rejected promise', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)

            readFileMock.mockRejectedValue(new Error('callback error'))

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toEqual(new Error('callback error'))

            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received error', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)

            readFileMock.mockImplementation(() => {
                throw new Error('callback error')
            })

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toThrow(new Error('callback error'))

            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received SyntaxError', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)

            // trailing comma on purpose
            readFileMock.mockResolvedValue('{"win": {"x64": [], "x86": [],}}')

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toThrow(new Error('Unexpected token } in JSON at position 30'))
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })

        it('should rethrow anything else', async () => {
            const url = 'my-url'
            existsAndIsFileMock.mockResolvedValue(true)

            readFileMock.mockImplementation(() => {
                throw 'something happened'
            })

            await expect(() => readStoreFile(createImportConfig({ url }))).rejects.toEqual('something happened')

            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith('something happened')
        })
    })
})
