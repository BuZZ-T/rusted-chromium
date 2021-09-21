import { existsSync, readFile, writeFile } from 'fs'
import * as path from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { ComparableVersion } from '../commons/ComparableVersion'
import { Store } from '../interfaces'
import { createStore, ReadFileWithOptions } from '../test.utils'
import store from './store'

jest.mock('fs')

const localPath = path.join(__dirname, '..', 'localstore.json')

describe('store', () => {

    describe('loadStore', () => {

        let existsSyncMock: MaybeMocked<typeof existsSync>
        let readFileMock: MaybeMocked<ReadFileWithOptions>

        beforeAll(() => {
            existsSyncMock = mocked(existsSync)
            readFileMock = mocked(readFile as ReadFileWithOptions)
        })

        beforeEach(() => {
            existsSyncMock.mockClear()
            readFileMock.mockClear()
        })

        it('should return an empty story on no store exists', async () => {
            existsSyncMock.mockReturnValue(false)

            const expectedStore = createStore()

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledTimes(0)
        })

        it('should return the store received from the existing file', async () => {
            existsSyncMock.mockReturnValue(true)

            readFileMock.mockImplementation((path, encoding, callback) => {
                callback(null, '{"linux": {"x64": ["1.2.3.4"], "x86": []},"mac": {"x64": [], "x86": []},"win": {"x64": [], "x86": []}}')
            })
            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] } })

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
        })

        it('should return an empty store on unparsable JSON', async () => {
            existsSyncMock.mockReturnValue(true)

            readFileMock.mockImplementation((path, encoding, callback) => {
                callback(null, '{"linux": ["1.2.3.4"],"mac": [],"win": []')
            })

            const expectedStore = createStore()

            expect(await store.loadStore()).toEqual(expectedStore)

            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledTimes(1)
            expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
        })
    })

    describe('storeNegativeHit', () => {

        let writeFileMock: MaybeMocked<typeof writeFile>
        let loadStoreMock: jest.SpyInstance<Promise<Store>, []>

        beforeAll(() => {
            writeFileMock = mocked(writeFile)
        })

        beforeEach(() => {
            writeFileMock.mockClear()

            loadStoreMock = jest.spyOn(store, 'loadStore').mockClear()
        })

        afterAll(() => {
            loadStoreMock.mockRestore()
        })

        it('should create a store with one entry if it does not exist', async () => {
            const mockedStore = createStore()

            loadStoreMock.mockResolvedValue(mockedStore)

            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            await store.storeNegativeHit(new ComparableVersion({
                major: 1,
                minor: 2,
                branch: 3,
                patch: 4,
            }), 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })

        it('should extend an existing store with one entry', async () => {
            const existingStore = createStore({ win: { x64: ['10.0.0.0'], x86: [] } })

            loadStoreMock.mockResolvedValue(existingStore)

            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            await store.storeNegativeHit(new ComparableVersion({
                major: 1,
                minor: 2,
                branch: 3,
                patch: 4,
            }), 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] }, win: { x64: ['10.0.0.0'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })

        it('should do nothing, if entry already exists', async () => {
            const existingStore = createStore({ win: { x64: ['10.0.0.0'], x86: [] }, linux: { x64: ['1.0.0.0'], x86: [] } })

            loadStoreMock.mockResolvedValue(existingStore)

            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            await store.storeNegativeHit(new ComparableVersion({
                major: 1,
                minor: 0,
                branch: 0,
                patch: 0,
            }), 'linux', 'x64')

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(0)
        })

        it('should sort an unsorted store on writing', async () => {
            const existingStore = createStore({ win: { x64: ['11.0.0.0', '10.0.0.0', '12.0.0.0'], x86: [] } })

            loadStoreMock.mockResolvedValue(existingStore)

            writeFileMock.mockImplementation((path, store, callback) => {
                callback(null)
            })

            await store.storeNegativeHit(new ComparableVersion({
                major: 1,
                minor: 2,
                branch: 3,
                patch: 4,
            }), 'linux', 'x64')

            const expectedStore = createStore({ linux: { x64: ['1.2.3.4'], x86: [] }, win: { x64: ['10.0.0.0', '11.0.0.0', '12.0.0.0'], x86: [], } })

            expect(loadStoreMock).toHaveBeenCalledTimes(1)

            expect(writeFileMock).toHaveBeenCalledTimes(1)
            expect(writeFileMock).toHaveBeenCalledWith(localPath, JSON.stringify(expectedStore, null, 4), expect.any(Function))
        })
    })
})
