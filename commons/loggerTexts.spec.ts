/**
 * Tests constants file
 *
 * @group unit/file/loggerTexts
 */

import type { TextFunction } from '../interfaces/interfaces'
import { EXTRACT_ZIP, READ_CONFIG } from './loggerTexts'

describe('constants', () => {

    it('should add the reason in the READ_CONFIG description', () => {
        expect((READ_CONFIG.fail as TextFunction)('the reason')).toEqual('Error loading localstore.json from filesystem: the reason')
    })

    it('should add the downloadPath in the EXTRACT_ZIP description', () => {
        expect((EXTRACT_ZIP.success as TextFunction)('the download-path')).toEqual('Successfully extracted to "the download-path"')
    })

    it('should add the error in the EXTRACT_ZIP description', () => {
        expect((EXTRACT_ZIP.fail as TextFunction)('the-error')).toEqual('Failed to extract binary the-error')
    })
})
