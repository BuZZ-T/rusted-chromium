/**
 * Tests download file
 *
 * @group unit/utils/typeguard
 */

import { isTextFunction, isIVersion, isIVersionWithDisabled, isChromeSingleConfig } from './typeguards'
import { ComparableVersion } from '../commons/ComparableVersion'

describe('typeguards', () => {

    describe('isTextFunction', () => {
        it('should correctly identify a string', () => {
            expect(isTextFunction('foo')).toBe(false)
        })

        it('should correctly identify a TextFunction', () => {
            expect(isTextFunction(text => `text is: ${text}`)).toBe(true)
        })

        it('should correctly identify undefined', () => {
            expect(isTextFunction(undefined)).toBe(false)
        })
    })

    describe('isIVersion', () => {
        it('should correctly identify an IVersion', () => {
            expect(isIVersion({
                major: 10,
                minor: 11,
                branch: 12,
                patch: 13,
            })).toBe(true)
        })

        it('should return false on string values', () => {
            expect(isIVersion({
                major: '10',
                minor: '11',
                branch: '12',
                patch: '13',
            })).toBe(false)
        })

        it('should return false on no major', () => {
            expect(isIVersion({
                minor: 11,
                branch: 12,
                patch: 13,
            })).toBe(false)
        })

        it('should return false on no minor', () => {
            expect(isIVersion({
                major: 10,
                branch: 12,
                patch: 13,
            })).toBe(false)
        })

        it('should return false on no branch', () => {
            expect(isIVersion({
                major: 10,
                minor: 11,
                patch: 13,
            })).toBe(false)
        })

        it('should return false on no patch', () => {
            expect(isIVersion({
                major: 10,
                minor: 11,
                branch: 12,
            })).toBe(false)
        })
    })

    describe('isIVersionWithDisabled', () => {
        it('should correctly identify an IVersionWithDisabled', () => {
            expect(isIVersionWithDisabled({
                major: 10,
                minor: 11,
                branch: 12,
                patch: 13,
                disabled: false,
            })).toBe(true)
        })

        it('should return false on string values', () => {
            expect(isIVersionWithDisabled({
                major: '10',
                minor: '11',
                branch: '12',
                patch: '13',
                disabled: 'false',
            })).toBe(false)
        })

        it('should return false on no disabled', () => {
            expect(isIVersionWithDisabled({
                major: 10,
                minor: 11,
                branch: 12,
                patch: 13,
            })).toBe(false)
        })

        it('should return false on no major', () => {
            expect(isIVersionWithDisabled({
                minor: 11,
                branch: 12,
                patch: 13,
                disabled: false,
            })).toBe(false)
        })

        it('should return false on no minor', () => {
            expect(isIVersionWithDisabled({
                major: 10,
                branch: 12,
                patch: 13,
                disabled: false,
            })).toBe(false)
        })

        it('should return false on no branch', () => {
            expect(isIVersionWithDisabled({
                major: 10,
                minor: 11,
                patch: 13,
                disabled: false,
            })).toBe(false)
        })

        it('should return false on no patch', () => {
            expect(isIVersionWithDisabled({
                major: 10,
                minor: 11,
                branch: 12,
                disabled: false,
            })).toBe(false)
        })
    })

    describe('isChromeSingleConfig', () => {
        it('should correctly identify an IChromeSingleConfig', () => {
            expect(isChromeSingleConfig({
                single: new ComparableVersion(1,2,3,4),
            })).toBe(true)
        })

        it('should return false on single === null', () => {
            expect(isChromeSingleConfig({
                single: null,
            })).toBe(false)
        })

        it('should return false on single === undefined', () => {
            expect(isChromeSingleConfig({
                inverse: false,
            })).toBe(false)
        })
    })
})
