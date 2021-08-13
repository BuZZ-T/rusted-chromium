import * as fs from 'fs'
import { mocked } from 'ts-jest/utils'
import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'

import { readStoreFile } from './readStore'
import { IStoreConfig } from '../interfaces'
import { createStore, PromisifyCallback, PROMISIFY_NO_ERROR } from '../test.utils'
import { LoggerSpinner, logger } from '../loggerSpinner'

jest.mock('fs')
jest.mock('../loggerSpinner')

describe('readStore', () => {

    describe('readStoreFile', () => {

        let fsMock: any
        let loggerMock: MaybeMockedDeep<LoggerSpinner>

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

            try {
                await readStoreFile(config)
                fail()
            } catch (e) {
                expect(e).toEqual(new Error('File does not exist'))
                expect(fsMock.readFile).toHaveBeenCalledTimes(0)
            }
        })
    })
})
