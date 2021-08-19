import * as fs from 'fs'
import * as path from 'path'
import { mocked } from 'ts-jest/utils'

import { ComparableVersion } from '../commons/ComparableVersion'
import { PromisifyCallback, PROMISIFY_NO_ERROR, createStore } from '../test.utils'
import store from './store'

jest.mock('fs')

const localPath = path.join(__dirname, '..', 'localstore.json')

describe('store', () => {

    describe('disableByStore', () => {

        let loadStoreMock: any

        beforeEach(() => {
            loadStoreMock = jest.spyOn(store, 'loadStore')
        })

        afterAll(() => {
            loadStoreMock.mockRestore()
        })

        it('should disable version for current OS, leaving other versions untouched', async () => {
            const mockedStore = createStore({ linux: { x86: [], x64: ['0.0.0.0', '3.3.3.3'] } })

            loadStoreMock.mockReturnValue(Promise.resolve(mockedStore))

            expect(await store.disableByStore([
                {
                    comparable: new ComparableVersion(1, 2, 3, 4),
                    disabled: false,
                    value: '1.2.3.4',
                },
                {
                    comparable: new ComparableVersion(1, 2, 3, 4),
                    disabled: false,
                    value: '3.3.3.3',
                },
            ], 'linux', 'x64')).toEqual([
                {
                    comparable: new ComparableVersion(1, 2, 3, 4),
                    disabled: false,
                    value: '1.2.3.4',
                },
                {
                    comparable: new ComparableVersion(1, 2, 3, 4),
                    disabled: true,
                    value: '3.3.3.3',
                },
            ])
        })
    })

    describe('loadStore', () => {

        let fsMock: any

        beforeEach(() => {
            fsMock = mocked(fs, true)
            fsMock.exists.mockClear()
            fsMock.readFile.mockClear()
        })

        it('should return an empty story on no store exists', async () => {
            fsMock.exists.mockImplementation((path: string, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, false)
            })

            const expectedStore = createStore()

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(fsMock.exists).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledTimes(0)
        })

        it('should return the store received from the existing file', async () => {
            fsMock.exists.mockImplementation((path: string, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, true)
            })

            fsMock.readFile.mockImplementation((path: string, encoding: string, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, '{"linux": {"x64": ["1.2.3.4"], "x86": []},"mac": {"x64": [], "x86": []},"win": {"x64": [], "x86": []}}')
            })
            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] } })

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(fsMock.exists).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
        })

        it('should return an empty store on unparsable JSON', async () => {
            fsMock.exists.mockImplementation((path: string, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, true)
            })

            fsMock.readFile.mockImplementation((path: string, encoding: string, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR, '{"linux": ["1.2.3.4"],"mac": [],"win": []')
            })

            const expectedStore = createStore()

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(fsMock.exists).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledTimes(1)
            expect(fsMock.readFile).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
        })
    })

    describe('storeNegativeHit', () => {

        let fsMock: any
        let loadStoreMock: any

        beforeEach(() => {
            fsMock = mocked(fs, true)
            fsMock.writeFile.mockClear()
            loadStoreMock = jest.spyOn(store, 'loadStore').mockClear()
        })

        afterAll(() => {
            loadStoreMock.mockRestore()
        })

        it('should create a store with one entry if it does not exist', async () => {
            const mockedStore = createStore()

            loadStoreMock.mockResolvedValue(mockedStore)

            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            await store.storeNegativeHit({
                comparable: new ComparableVersion(1, 2, 3, 4),
                disabled: true,
                value: '1.2.3.4',
            }, 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })

        it('should extend an existing store with one entry', async () => {
            const existingStore = createStore({ win: { x64: ['10.0.0.0'], x86: [] } })

            loadStoreMock.mockReturnValue(existingStore)

            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            await store.storeNegativeHit({
                comparable: new ComparableVersion(1, 2, 3, 4),
                disabled: true,
                value: '1.2.3.4',
            }, 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] }, win: { x64: ['10.0.0.0'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })

        it('should sort an unsorted store on writing', async () => {
            const existingStore = createStore({ win: { x64: ['11.0.0.0', '10.0.0.0', '12.0.0.0'], x86: [] } })

            loadStoreMock.mockReturnValue(existingStore)

            fsMock.writeFile.mockImplementation((path: string, store: any, callback: PromisifyCallback) => {
                callback(PROMISIFY_NO_ERROR)
            })

            await store.storeNegativeHit({
                comparable: new ComparableVersion(1, 2, 3, 4),
                disabled: true,
                value: '1.2.3.4',
            }, 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] }, win: { x64: ['10.0.0.0', '11.0.0.0', '12.0.0.0'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
            expect(fsMock.writeFile).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })

    })

})
