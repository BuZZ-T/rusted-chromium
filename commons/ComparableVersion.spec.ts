/**
 * Tests ComparableVersion class
 *
 * @group unit/class/ComparableVersion
 */

import { Compared } from '../interfaces/enums'
import { ComparableVersion } from './ComparableVersion'

describe('ComparableVersion', () => {

    describe('IVersion input', () => {
        it('should create a ComparableVersion with first input', () => {
            const versionString = '10.0.1.2'
            const versionObject = {
                major: 10,
                minor: 0,
                branch: 1,
                patch: 2,
            }
            const cVersion = new ComparableVersion(versionObject)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with second input', () => {
            const versionString = '10.20.30.40'
            const versionObject = {
                major: 10,
                minor: 20,
                branch: 30,
                patch: 40,
            }
            const cVersion = new ComparableVersion(versionObject)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(20)
            expect(cVersion.branch).toEqual(30)
            expect(cVersion.patch).toEqual(40)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with third input', () => {
            const versionString = '10.0.1000.2'
            const versionObject = {
                major: 10,
                minor: 0,
                branch: 1000,
                patch: 2,
            }
            const cVersion = new ComparableVersion(versionObject)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1000)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with forth input', () => {
            const versionString = '10.0.0.100'
            const versionObject = {
                major: 10,
                minor: 0,
                branch: 0,
                patch: 100,
            }
            const cVersion = new ComparableVersion(versionObject)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(100)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with fifth input', () => {
            const versionString = '100.0.0.1'
            const versionObject = {
                major: 100,
                minor: 0,
                branch: 0,
                patch: 1,
            }
            const cVersion = new ComparableVersion(versionObject)
            expect(cVersion.major).toEqual(100)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(1)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with ComparableVersion as input', () => {
            const versionString = '100.0.0.1'

            const oldComparable = new ComparableVersion({
                major: 100,
                minor: 0,
                branch: 0,
                patch: 1,
            })

            const cVersion = new ComparableVersion(oldComparable)
            expect(cVersion.major).toEqual(100)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(1)

            expect(cVersion.toString()).toEqual(versionString)
        })
    })

    describe('number input', () => {
        it('should create a ComparableVersion with first input', () => {
            const cVersion = new ComparableVersion(10, 0, 1, 2)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual('10.0.1.2')
        })

        it('should create a ComparableVersion with second input', () => {
            const cVersion = new ComparableVersion(10, 20, 30, 40)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(20)
            expect(cVersion.branch).toEqual(30)
            expect(cVersion.patch).toEqual(40)

            expect(cVersion.toString()).toEqual('10.20.30.40')
        })

        it('should create a ComparableVersion with third input', () => {
            const cVersion = new ComparableVersion(10, 0, 1000, 2)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1000)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual('10.0.1000.2')
        })

        it('should create a ComparableVersion with forth input', () => {
            const cVersion = new ComparableVersion(10, 0, 0, 100)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(100)

            expect(cVersion.toString()).toEqual('10.0.0.100')
        })

        it('should create a ComparableVersion with fifth input', () => {
            const cVersion = new ComparableVersion(100, 0, 0, 1)

            expect(cVersion.major).toEqual(100)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(1)

            expect(cVersion.toString()).toEqual('100.0.0.1')
        })
    })

    describe('string input', () => {
        it('should create a ComparableVersion with first input', () => {
            const versionString = '10.0.1.2'
            const cVersion = new ComparableVersion(versionString)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with second input', () => {
            const versionString = '10.20.30.40'
            const cVersion = new ComparableVersion(versionString)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(20)
            expect(cVersion.branch).toEqual(30)
            expect(cVersion.patch).toEqual(40)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with third input', () => {
            const versionString = '10.0.1000.2'
            const cVersion = new ComparableVersion(versionString)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(1000)
            expect(cVersion.patch).toEqual(2)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with forth input', () => {
            const versionString = '10.0.0.100'
            const cVersion = new ComparableVersion(versionString)

            expect(cVersion.major).toEqual(10)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(100)

            expect(cVersion.toString()).toEqual(versionString)
        })

        it('should create a ComparableVersion with fifth input', () => {
            const versionString = '100.0.0.1'
            const cVersion = new ComparableVersion(versionString)

            expect(cVersion.major).toEqual(100)
            expect(cVersion.minor).toEqual(0)
            expect(cVersion.branch).toEqual(0)
            expect(cVersion.patch).toEqual(1)

            expect(cVersion.toString()).toEqual(versionString)
        })
    })

    describe('compare', () => {
        it('should compare major versions', () => {
            expect(new ComparableVersion(10, 0, 0, 0).compare(new ComparableVersion(20, 0, 0, 0))).toEqual(Compared.LESS)
            expect(new ComparableVersion(20, 0, 0, 0).compare(new ComparableVersion(10, 0, 0, 0))).toEqual(Compared.GREATER)
        })

        it('should compare minor versions', () => {
            expect(new ComparableVersion(10, 0, 0, 0).compare(new ComparableVersion(10, 1, 0, 0))).toEqual(Compared.LESS)
            expect(new ComparableVersion(10, 1, 0, 0).compare(new ComparableVersion(10, 0, 0, 0))).toEqual(Compared.GREATER)
        })

        it('should compare branch versions', () => {
            expect(new ComparableVersion(10, 0, 0, 0).compare(new ComparableVersion(10, 0, 1, 0))).toEqual(Compared.LESS)
            expect(new ComparableVersion(10, 0, 1, 0).compare(new ComparableVersion(10, 0, 0, 0))).toEqual(Compared.GREATER)
        })

        it('should compare patch versions', () => {
            expect(new ComparableVersion(10, 0, 0, 0).compare(new ComparableVersion(10, 0, 0, 1))).toEqual(Compared.LESS)
            expect(new ComparableVersion(10, 0, 0, 1).compare(new ComparableVersion(10, 0, 0, 0))).toEqual(Compared.GREATER)
        })

        it('should compare equal versions', () => {
            expect(new ComparableVersion(10, 1, 2, 3).compare(new ComparableVersion(10, 1, 2, 3))).toEqual(Compared.EQUAL)
        })
    })

    describe('max', () => {
        it('should select the greater major version', () => {
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(15, 0, 0, 0),
                new ComparableVersion(20, 0, 0, 0)
            )).toEqual(new ComparableVersion(20, 0, 0, 0))
            expect(ComparableVersion.max(
                new ComparableVersion(20, 0, 0, 0),
                new ComparableVersion(15, 0, 0, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(new ComparableVersion(20, 0, 0, 0))
        })

        it('should select the greater minor version', () => {
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 1, 0, 0),
                new ComparableVersion(10, 2, 0, 0)
            )).toEqual(new ComparableVersion(10, 2, 0, 0))
            expect(ComparableVersion.max(
                new ComparableVersion(10, 2, 0, 0),
                new ComparableVersion(10, 1, 0, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(new ComparableVersion(10, 2, 0, 0))
        })

        it('should select the greater branch version', () => {
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 0, 1, 0),
                new ComparableVersion(10, 0, 2, 0),

            )).toEqual(new ComparableVersion(10, 0, 2, 0))
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 2, 0),
                new ComparableVersion(10, 0, 1, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(new ComparableVersion(10, 0, 2, 0))
        })

        it('should select the greater patch version', () => {
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 0, 0, 1),
                new ComparableVersion(10, 0, 0, 2),
            )).toEqual(new ComparableVersion(10, 0, 0, 2))
            expect(ComparableVersion.max(
                new ComparableVersion(10, 0, 0, 2),
                new ComparableVersion(10, 0, 0, 1),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(new ComparableVersion(10, 0, 0, 2))
        })

        it('should select one of both equal versions', () => {
            expect(ComparableVersion.max(
                new ComparableVersion(10, 1, 2, 3),
                new ComparableVersion(10, 1, 2, 3)
            )).toEqual(new ComparableVersion(10, 1, 2, 3))
        })
    })

    describe('nextMajorVersion', () => {
        it('should go to the next major version', () => {
            expect(new ComparableVersion({
                major: 10,
                minor: 11,
                branch: 12,
                patch: 13,
            }).nextMajorVersion()).toEqual(new ComparableVersion({
                major: 11,
                minor: 0,
                branch: 0,
                patch: 0,
            }))
        })

        it('should go to five major versions up', () => {
            expect(new ComparableVersion({
                major: 10,
                minor: 11,
                branch: 12,
                patch: 13,
            }).nextMajorVersion(5)).toEqual(new ComparableVersion({
                major: 15,
                minor: 0,
                branch: 0,
                patch: 0,
            }))
        })
    })
})
