/**
 * Tests rusted file
 * 
 * @group unit/file/store/loadStore
 */

import { readFile } from 'node:fs/promises'
import { join as pathJoin } from 'node:path'
import type { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { createStore } from '../test/test.utils'
import { existsAndIsFile } from '../utils/file.utils'
import { loadStore } from './loadStore'
import { Store } from './Store'

jest.mock('node:fs/promises')

jest.mock('../utils/file.utils')

const localPath = pathJoin(__dirname, '..', 'localstore.json')

describe('loadStore', () => {

    let existsSyncMock: MaybeMocked<typeof existsAndIsFile>
    let readFileMock: MaybeMocked<typeof readFile>

    beforeAll(() => {
        existsSyncMock = mocked(existsAndIsFile)
        readFileMock = mocked(readFile)
    })

    beforeEach(() => {
        existsSyncMock.mockClear()
        readFileMock.mockClear()
    })

    it('should return an empty story on no store exists', async () => {
        existsSyncMock.mockResolvedValue(false)

        const expectedStore = new Store(createStore())

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(0)
    })

    it('should return the store received from the existing file', async () => {
        existsSyncMock.mockResolvedValue(true)

        readFileMock.mockResolvedValue('{"linux": {"x64": ["1.2.3.4"], "x86": []},"mac": {"x64": [], "arm": []},"win": {"x64": [], "x86": []}}')
        const expectedStore = new Store(createStore({ linux: { x64: ['1.2.3.4'], x86: [] } }))

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8')
    })

    it('should return an empty store on unparsable JSON', async () => {
        existsSyncMock.mockResolvedValue(true)

        readFileMock.mockResolvedValue('{"linux": ["1.2.3.4"],"mac": [],"win": []')

        const expectedStore = new Store(createStore())

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8')
    })
})
