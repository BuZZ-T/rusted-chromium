/**
 * Tests constants file
 * 
 * @group unit/file/constants
 */

import type { TextFunction } from '../interfaces/interfaces'
import { READ_CONFIG } from './loggerTexts'

describe('constants', () => {

    it('should add the reason in the description', () => {
        expect((READ_CONFIG.fail as TextFunction)('the reason')).toEqual('Error loading localstore.json from filesystem: the reason')
    })
})
