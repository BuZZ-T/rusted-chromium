import { ComparableVersion } from './ComparableVersion'

describe('ComparableVersion', () => {

    describe('object input', () => {
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
})
