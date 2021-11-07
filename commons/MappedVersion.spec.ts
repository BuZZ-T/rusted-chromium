import type { IVersionWithDisabled } from '../interfaces/interfaces'
import { MappedVersion } from './MappedVersion'

describe('MappedVersion', () => {
    describe('string input', () => {
        it('should create a MappedVersion with first input', () => {
            const versionString = '10.0.1.2'
            const mVersion = new MappedVersion(versionString, false)

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(0)
            expect(mVersion.comparable.branch).toEqual(1)
            expect(mVersion.comparable.patch).toEqual(2)
            expect(mVersion.disabled).toEqual(false)
            expect(mVersion.value).toEqual(versionString)
        })

        it('should create a MappedVersion with second input', () => {
            const versionString = '10.20.30.40'
            const mVersion = new MappedVersion(versionString, true)

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(20)
            expect(mVersion.comparable.branch).toEqual(30)
            expect(mVersion.comparable.patch).toEqual(40)
            expect(mVersion.disabled).toEqual(true)
            expect(mVersion.value).toEqual(versionString)
        })
    })

    describe('number input', () => {
        it('should create a MappedVersion with first input', () => {
            const versionString = '10.0.1.2'
            const mVersion = new MappedVersion(10, 0, 1, 2, false)

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(0)
            expect(mVersion.comparable.branch).toEqual(1)
            expect(mVersion.comparable.patch).toEqual(2)
            expect(mVersion.disabled).toEqual(false)
            expect(mVersion.value).toEqual(versionString)
        })

        it('should create a MappedVersion with second input', () => {
            const versionString = '10.20.30.40'
            const mVersion = new MappedVersion(10, 20, 30, 40, true)

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(20)
            expect(mVersion.comparable.branch).toEqual(30)
            expect(mVersion.comparable.patch).toEqual(40)
            expect(mVersion.disabled).toEqual(true)
            expect(mVersion.value).toEqual(versionString)
        })
    })

    describe('version input', () => {
        it('should create a MappedVersion with first input', () => {
            const versionString = '10.0.1.2'
            const mVersion = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 2,
                disabled: false,
            })

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(0)
            expect(mVersion.comparable.branch).toEqual(1)
            expect(mVersion.comparable.patch).toEqual(2)
            expect(mVersion.disabled).toEqual(false)
            expect(mVersion.value).toEqual(versionString)
        })

        it('should create a MappedVersion with second input', () => {
            const versionString = '10.20.30.40'
            const mVersion = new MappedVersion({
                major: 10,
                minor: 20,
                branch: 30,
                patch: 40,
                disabled: true,
            })

            expect(mVersion.comparable.major).toEqual(10)
            expect(mVersion.comparable.minor).toEqual(20)
            expect(mVersion.comparable.branch).toEqual(30)
            expect(mVersion.comparable.patch).toEqual(40)
            expect(mVersion.disabled).toEqual(true)
            expect(mVersion.value).toEqual(versionString)
        })
    })

    it('should throw an error on unknwon input', () => {
        expect(() => new MappedVersion(0 as unknown as IVersionWithDisabled)).toThrow('This should not happen, MappedVersion called with wrong types!')
    })

    it('should disable the version', () => {
        const version = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: false
        })

        expect(version.disabled).toBe(false)

        version.disable()

        expect(version.disabled).toBe(true)
    })
})
