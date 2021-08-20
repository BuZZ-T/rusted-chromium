import * as fs from 'fs'
import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { IStoreConfig } from '../interfaces'
import { Spinner, logger } from '../log/spinner'
import { createStore, PromisifyCallback, PROMISIFY_NO_ERROR } from '../test.utils'
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
    })
})
