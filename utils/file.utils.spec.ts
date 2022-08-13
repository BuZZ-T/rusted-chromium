/**
 * Tests file utils
 * 
 * @group unit/utils/files
 */

import { Stats } from 'fs'
import { stat } from 'fs/promises'
import { mocked } from 'ts-jest/utils'

import { existsAndIsFile, existsAndIsFolder } from './file.utils'

jest.mock('fs/promises')

describe('file.utils', () => {

    const statMock = mocked(stat)

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
