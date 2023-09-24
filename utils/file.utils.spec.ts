/**
 * Tests file utils
 *
 * @group unit/utils/files
 */

import type { Stats } from 'node:fs'
import { stat } from 'node:fs/promises'

import { existsAndIsFile, existsAndIsFolder } from './file.utils'

jest.mock('node:fs/promises')

describe('file.utils', () => {

    const statMock = jest.mocked(stat)

    beforeEach(() => {
        statMock.mockReset()
    })

    describe('existsAndIsFile', () => {
        it('should return false on non-exist', async () => {
            statMock.mockRejectedValue(new Error('some-error'))

            expect(await existsAndIsFile('some-file')).toEqual(false)
        })

        it('should return false on no file', async () => {
            statMock.mockResolvedValue({isFile: () => false} as Stats)

            expect(await existsAndIsFile('some-file')).toEqual(false)
        })

        it('should return on exist and is file', async () => {
            statMock.mockResolvedValue({isFile: () => true} as Stats)

            expect(await existsAndIsFile('some-file')).toEqual(true)
        })
    })

    describe('existsAndIsFolder', () => {
        it('should return false on non-exist', async () => {
            statMock.mockRejectedValue(new Error('some-error'))

            expect(await existsAndIsFolder('some-folder')).toEqual(false)
        })

        it('should return false on no file', async () => {
            statMock.mockResolvedValue({isDirectory: () => false} as Stats)

            expect(await existsAndIsFolder('some-folder')).toEqual(false)
        })

        it('should return on exist and is file', async () => {
            statMock.mockResolvedValue({isDirectory: () => true} as Stats)

            expect(await existsAndIsFolder('some-folder')).toEqual(true)
        })
    })
})
