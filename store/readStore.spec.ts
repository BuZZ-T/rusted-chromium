import * as fs from 'fs'
import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { IStoreConfig } from '../interfaces'
import { Spinner, logger } from '../log/spinner'
import { createStore, PromisifyCallback, PROMISIFY_NO_ERROR, PromisifyErrorCallback } from '../test.utils'
import { readStoreFile } from './readStore'

jest.mock('fs')
jest.mock('../log/spinner')

describe('readStore', () => {

    describe('readStoreFile', () => {

        let fsMock: any
        let loggerMock: MaybeMockedDeep<Spinner>

        beforeEach(() => {
            fsMock = mocked(fs, true)
            fsMock.readFile.mockReset()

            loggerMock = mocked(logger, true)
            loggerMock.start.mockClear()
            loggerMock.success.mockClear()
            loggerMock.error.mockClear()
        })

        it('should return the parsed store received from the file system', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(true)
            const expectedStore = createStore()
            const config: IStoreConfig = {
                url,
            }
            fsMock.readFile.mockImplementation((path: string, options: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, Promise.resolve(JSON.stringify(expectedStore, null, 2)))
            })

            expect(await readStoreFile(config)).toEqual(expectedStore)
            expect(fsMock.readFile).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledWith(url, { encoding: 'utf-8' }, expect.any(Function))
        })

        it('should reject the returned Promise on file not exist on filesystem', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(false)
            const expectedStore = createStore()
            const config: IStoreConfig = {
                url,
            }
            fsMock.readFile.mockImplementation((path: string, options: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, Promise.resolve(JSON.stringify(expectedStore, null, 2)))
            })

            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('File does not exist'))
            expect(fsMock.readFile).toHaveBeenCalledTimes(0)
        })

        it('should throw an error on unparsable JSON', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }
            fsMock.readFile.mockImplementation((path: string, options: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, Promise.resolve('{"Not parseable": "6}'))
            })
            
            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('Unexpected end of JSON input'))
            expect(loggerMock.success).toHaveBeenCalledTimes(0)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })

        it('should throw an error on error in promisify callback', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            fsMock.readFile.mockImplementation((path: string, options: any, callback: PromisifyErrorCallback) => {
                callback(new Error('callback error'), Promise.resolve(null))
            })
            
            await expect(() => readStoreFile(config)).rejects.toEqual(new Error('callback error'))

            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received error', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            fsMock.readFile.mockImplementation(() => {
                throw new Error('callback error')
            })
            
            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('callback error'))

            expect(fsMock.readFile).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Error: callback error')
        })

        it('should rethrow a received SyntaxError', async () => {
            const url = 'my-url'
            fsMock.existsSync.mockReturnValue(true)
            const config: IStoreConfig = {
                url,
            }

            fsMock.readFile.mockImplementation((path: string, options: any, callback: PromisifyCallback) => {
                // trailing comma on purpose
                callback(PROMISIFY_NO_ERROR, Promise.resolve('{"win": {"x64": [], "x86": [],}}'))
            })
            
            await expect(() => readStoreFile(config)).rejects.toThrow(new Error('Unexpected token } in JSON at position 30'))
            expect(fsMock.readFile).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith('Unable to parse JSON file')
        })
    })
})
