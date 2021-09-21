import { readFile, existsSync } from 'fs'
import { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { IStoreConfig } from '../interfaces'
import { Spinner, logger } from '../log/spinner'
import { createStore, ReadFileWithOptions } from '../test.utils'
import { readStoreFile } from './readStore'

jest.mock('fs')
jest.mock('../log/spinner')

describe('readStore', () => {

    describe('readStoreFile', () => {

        let readFileMock: MaybeMocked<ReadFileWithOptions>
        let existsSyncMock: MaybeMocked<typeof existsSync>
        let loggerMock: MaybeMockedDeep<Spinner>

        beforeAll(() => {
            readFileMock = mocked(readFile as ReadFileWithOptions)
            existsSyncMock = mocked(existsSync)

            loggerMock = mocked(logger, true)
        })

        beforeEach(() => {
            readFileMock.mockReset()
            existsSyncMock.mockClear()

            loggerMock.start.mockClear()
            loggerMock.success.mockClear()
            loggerMock.error.mockClear()
        })

        it('should return the parsed store received from the file system', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const expectedStore = createStore()
            const config: IStoreConfig = {
                url,
            }
            readFileMock.mockImplementation((path, options, callback) => {
                callback(null, JSON.stringify(expectedStore, null, 2))
            })

            expect(await readStoreFile(config)).toEqual(expectedStore)
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledWith(url, { encoding: 'utf-8' }, expect.any(Function))
        })

        it('should reject the returned Promise on file not exist on filesystem', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(false)
            const expectedStore = createStore()
            const config: IStoreConfig = {
                url,
            }
            readFileMock.mockImplementation((path, options, callback) => {
                callback(null, JSON.stringify(expectedStore, null, 2))
            })

            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('File does not exist'))
            expect(readFileMock).toHaveBeenCalledTimes(0)
        })

        it('should throw an error on unparsable JSON', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }
            readFileMock.mockImplementation((path, options, callback) => {
                callback(null, '{"Not parseable": "6}')
            })

            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('Unexpected end of JSON input'))
            expect(loggerMock.success).toHaveBeenCalledTimes(0)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })

        it('should throw an error on error in promisify callback', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            readFileMock.mockImplementation((path, option, callback) => {
                callback(new Error('callback error'), '')
            })

            await expect(() => readStoreFile(config)).rejects.toEqual(new Error('callback error'))

            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received error', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            readFileMock.mockImplementation(() => {
                throw new Error('callback error')
            })

            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('callback error'))

            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received SyntaxError', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            readFileMock.mockImplementation((path, options, callback) => {
                // trailing comma on purpose
                callback(null, '{"win": {"x64": [], "x86": [],}}')
            })

            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('Unexpected token } in JSON at position 30'))
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })

        it('should rethrow anything else', async () => {
            const url = 'my-url'
            existsSyncMock.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            readFileMock.mockImplementation(() => {
                throw 'something happened'
            })

            await expect(() => readStoreFile(config)).rejects.toEqual('something happened')

            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('something happened')
        })
    })
})
