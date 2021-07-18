import { mocked } from 'ts-jest/utils'
import { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'

import { logger, LoggerSpinner } from '../loggerSpinner'
import { downloadStore } from './downloadStore'
import { fetchLocalStore } from '../api'
import { LOAD_CONFIG } from '../constants'
import { createStore } from '../test.utils'

jest.mock('../loggerSpinner')
jest.mock('../api')

describe('downloadStore', () => {
    let loggerMock: MaybeMockedDeep<LoggerSpinner>
    let fetchLocalStoreMock: MaybeMocked<typeof fetchLocalStore>

    beforeEach(() => {
        fetchLocalStoreMock = mocked(fetchLocalStore)
        fetchLocalStoreMock.mockReset()

        loggerMock = mocked(logger, true)
        loggerMock.start.mockReset()
        loggerMock.success.mockReset()
        loggerMock.error.mockReset()
    })

    it('should load the store and return it', async () => {
        const filename = 'myfile.json'
        const url = `http://some-url.de/${filename}`
        const store = createStore()
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.resolve(JSON.stringify(store, null, 2))
        )

        expect(await downloadStore({ url }, filename)).toEqual(store)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(url)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(1)
        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should extend the url and filename if it\'s is not part', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de/'
        const store = createStore()
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.resolve(JSON.stringify(store, null, 2))
        )

        expect(await downloadStore({ url }, filename)).toEqual(store)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}${filename}`)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(1)
        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should extend the url with slash and filename if it\'s is not part', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        const store = createStore()
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.resolve(JSON.stringify(store, null, 2))
        )

        expect(await downloadStore({ url }, filename)).toEqual(store)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(1)
        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should log an error on failing request', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.reject()
        )
        
        expect(await downloadStore({ url }, filename)).toBe(undefined)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(0)
        expect(loggerMock.error).toHaveBeenCalledTimes(2)
        expect(loggerMock.error).toHaveBeenCalledWith()
    })

    it('should log an error with message and path on failing request', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        fetchLocalStoreMock.mockImplementation((): Promise<any> =>
            Promise.reject({message: 'error-msg', path: 'error-path'})
        )
        
        expect(await downloadStore({ url }, filename)).toBe(undefined)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(0)
        expect(loggerMock.error).toHaveBeenCalledTimes(2)
        expect(loggerMock.error).toHaveBeenCalledWith('error-msg: error-path')
    })
})
