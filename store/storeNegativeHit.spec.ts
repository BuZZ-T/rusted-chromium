/**
 * Tests rusted file
 * 
 * @group unit/file/store/storeNegativeHit
 */

import { writeFile } from 'fs'
import { join as pathJoin } from 'path'
import type { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { ComparableVersion } from '../commons/ComparableVersion'
import { createStore } from '../test/test.utils'
import { loadStore } from './loadStore'
import { Store } from './Store'
import { storeNegativeHit } from './storeNegativeHit'

jest.mock('fs')
jest.mock('./loadStore')

const localPath = pathJoin(__dirname, '..', 'localstore.json')

describe('storeNegativeHit', () => {

    let writeFileMock: MaybeMocked<typeof writeFile>
    let loadStoreMock: MaybeMocked<typeof loadStore>

    beforeAll(() => {
        writeFileMock = mocked(writeFile)
        loadStoreMock = mocked(loadStore)
    })

    beforeEach(() => {
        writeFileMock.mockClear()
        loadStoreMock.mockClear()
    })

    afterAll(() => {
        loadStoreMock.mockRestore()
    })

    it('should create a store with one entry if it does not exist', async () => {
        const mockedStore = createStore()
        const mStore = new Store(mockedStore)

        loadStoreMock.mockResolvedValue(mStore)

        writeFileMock.mockImplementation((path, store, callback) => {
            callback(null)
        })

        await storeNegativeHit(new ComparableVersion({
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
        const eStore = new Store(existingStore)

        loadStoreMock.mockResolvedValue(eStore)

        writeFileMock.mockImplementation((path, store, callback) => {
            callback(null)
        })

        await storeNegativeHit(new ComparableVersion({
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
        const eStore = new Store(existingStore)

        loadStoreMock.mockResolvedValue(eStore)

        writeFileMock.mockImplementation((path, store, callback) => {
            callback(null)
        })

        await storeNegativeHit(new ComparableVersion({
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
        const eStore = new Store(existingStore)

        loadStoreMock.mockResolvedValue(eStore)

        writeFileMock.mockImplementation((path, store, callback) => {
            callback(null)
        })

        await storeNegativeHit(new ComparableVersion({
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
