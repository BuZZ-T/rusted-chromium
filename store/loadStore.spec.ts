import { existsSync, readFile } from 'fs'
import * as path from 'path'
import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { createStore, ReadFileWithOptions } from '../test.utils'
import { loadStore } from './loadStore'
import { Store } from './Store'

jest.mock('fs')

const localPath = path.join(__dirname, '..', 'localstore.json')

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

        const expectedStore = new Store(createStore())

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(0)
    })

    it('should return the store received from the existing file', async () => {
        existsSyncMock.mockReturnValue(true)

        readFileMock.mockImplementation((path, encoding, callback) => {
            callback(null, '{"linux": {"x64": ["1.2.3.4"], "x86": []},"mac": {"x64": [], "arm": []},"win": {"x64": [], "x86": []}}')
        })
        const expectedStore = new Store(createStore({ linux: { x64: ['1.2.3.4'], x86: [] } }))

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
    })

    it('should return an empty store on unparsable JSON', async () => {
        existsSyncMock.mockReturnValue(true)

        readFileMock.mockImplementation((path, encoding, callback) => {
            callback(null, '{"linux": ["1.2.3.4"],"mac": [],"win": []')
        })

        const expectedStore = new Store(createStore())

        expect(await loadStore()).toEqual(expectedStore)

        expect(existsSyncMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledTimes(1)
        expect(readFileMock).toHaveBeenCalledWith(localPath, 'utf8', expect.any(Function))
    })
})
