import * as fs from 'fs'
import { mocked } from 'ts-jest/utils'

import { readStoreFile } from './readStore'
import { IStoreConfig } from '../interfaces'
import { createStore, PromisifyCallback, PROMISIFY_NO_ERROR } from '../test.utils'

jest.mock('fs')

describe('readStore', () => {

    describe('readStoreFile', () => {

        let fsMock: any

        beforeEach(() => {
            fsMock = mocked(fs, true)
            fsMock.readFile.mockReset()
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
                expect(e).toBe(undefined)
                expect(fsMock.readFile).toHaveBeenCalledTimes(0)
            }
        })
    })
})
