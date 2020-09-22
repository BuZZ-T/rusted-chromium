import * as fs from 'fs'
import { mocked } from 'ts-jest/utils'
import { MaybeMockedDeep } from 'ts-jest/dist/util/testing'

import { logger, LoggerSpinner } from './loggerSpinner'
import load from './load'
import { fetchLocalStore } from './api'

jest.mock('fs')
jest.mock('./loggerSpinner')
jest.mock('./api')

const PROMISIFY_NO_ERROR = false

describe('load', () => {
    let loggerMock: MaybeMockedDeep<LoggerSpinner>
    let fetchLocalStoreMock: any
    let fsMock: any

    beforeEach(() => {
        fetchLocalStoreMock = mocked(fetchLocalStore)
        fsMock = mocked(fs, true)
        fsMock.writeFile.mockClear()
        loggerMock = mocked(logger, true)
    })

    it('should load the store and saves the received file in work directory with the given name', async () => {
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.resolve({
                ok: true,
                text() {
                    return Promise.resolve('some-html')
                }
            })
        )

        const LOCAL_STORE_LOCATION = 'my-local-store.json'

        fsMock.writeFile.mockImplementation((path: string, store: any, callback: (p: boolean) => void) => {
            callback(PROMISIFY_NO_ERROR)
            expect(path).toEqual(LOCAL_STORE_LOCATION)
        })

        await load.downloadStore({ url: 'my-url' }, LOCAL_STORE_LOCATION)

    })
})
