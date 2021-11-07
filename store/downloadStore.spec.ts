import type { MaybeMockedDeep, MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { fetchLocalStore } from '../api'
import { LOAD_CONFIG } from '../commons/constants'
import { logger, Spinner } from '../log/spinner'
import { createStore, createImportConfig } from '../test.utils'
import { downloadStore } from './downloadStore'
import { Store } from './Store'

jest.mock('../log/spinner')
jest.mock('../api')

describe('downloadStore', () => {
    let loggerMock: MaybeMockedDeep<Spinner>
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
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

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
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

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
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

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
        fetchLocalStoreMock.mockRejectedValue(undefined)

        await expect(downloadStore(createImportConfig({ url }), filename)).rejects.toEqual(undefined)

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
        fetchLocalStoreMock.mockRejectedValue({ message: 'error-msg', path: 'error-path' })

        await expect(downloadStore(createImportConfig({ url }), filename)).rejects.toEqual({ message: 'error-msg', path: 'error-path' })

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(loggerMock.start).toHaveBeenCalledTimes(1)
        expect(loggerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(loggerMock.success).toHaveBeenCalledTimes(0)
        expect(loggerMock.error).toHaveBeenCalledTimes(2)
        expect(loggerMock.error).toHaveBeenCalledWith('error-msg: error-path')
    })
})
