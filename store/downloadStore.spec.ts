/**
 * Tests downloadStore file
 * 
 * @group unit/file/store/downloadStore
 */

import { fetchLocalStore } from '../api'
import { LOAD_CONFIG } from '../commons/loggerTexts'
import { spinner, Spinner } from '../log/spinner'
import { createStore, createImportConfig } from '../test/test.utils'
import { downloadStore } from './downloadStore'
import { Store } from './Store'

jest.mock('../log/spinner')
jest.mock('../api')

describe('downloadStore', () => {
    let spinnerMock: jest.MaybeMockedDeep<Spinner>
    let fetchLocalStoreMock: jest.MaybeMocked<typeof fetchLocalStore>

    beforeEach(() => {
        fetchLocalStoreMock = jest.mocked(fetchLocalStore)
        fetchLocalStoreMock.mockReset()

        spinnerMock = jest.mocked(spinner, true)
        spinnerMock.start.mockReset()
        spinnerMock.success.mockReset()
        spinnerMock.error.mockReset()
    })

    it('should load the store and return it', async () => {
        const filename = 'myfile.json'
        const url = `http://some-url.de/${filename}`
        const store = createStore()
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(url)

        expect(spinnerMock.start).toHaveBeenCalledTimes(1)
        expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(spinnerMock.success).toHaveBeenCalledTimes(1)
        expect(spinnerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should extend the url and filename if it\'s is not part', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de/'
        const store = createStore()
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}${filename}`)

        expect(spinnerMock.start).toHaveBeenCalledTimes(1)
        expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(spinnerMock.success).toHaveBeenCalledTimes(1)
        expect(spinnerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should extend the url with slash and filename if it\'s is not part', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        const store = createStore()
        fetchLocalStoreMock.mockResolvedValue(store)

        expect(await downloadStore(createImportConfig({ url }), filename)).toEqual(new Store(store))

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(spinnerMock.start).toHaveBeenCalledTimes(1)
        expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(spinnerMock.success).toHaveBeenCalledTimes(1)
        expect(spinnerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should log an error on failing request', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        fetchLocalStoreMock.mockRejectedValue(undefined)

        await expect(downloadStore(createImportConfig({ url }), filename)).rejects.toEqual(undefined)

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(spinnerMock.start).toHaveBeenCalledTimes(1)
        expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(spinnerMock.success).toHaveBeenCalledTimes(0)
        expect(spinnerMock.error).toHaveBeenCalledTimes(2)
        expect(spinnerMock.error).toHaveBeenCalledWith()
    })

    it('should log an error with message and path on failing request', async () => {
        const filename = 'myfile.json'
        const url = 'http://some-url.de'
        fetchLocalStoreMock.mockRejectedValue({ message: 'error-msg', path: 'error-path' })

        await expect(downloadStore(createImportConfig({ url }), filename)).rejects.toEqual({ message: 'error-msg', path: 'error-path' })

        expect(fetchLocalStoreMock).toHaveBeenCalledTimes(1)
        expect(fetchLocalStoreMock).toHaveBeenCalledWith(`${url}/${filename}`)

        expect(spinnerMock.start).toHaveBeenCalledTimes(1)
        expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_CONFIG)
        expect(spinnerMock.success).toHaveBeenCalledTimes(0)
        expect(spinnerMock.error).toHaveBeenCalledTimes(2)
        expect(spinnerMock.error).toHaveBeenCalledWith('error-msg: error-path')
    })
})
