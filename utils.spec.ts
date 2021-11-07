import { ComparableVersion } from './commons/ComparableVersion'
import { MappedVersion } from './commons/MappedVersion'
import { Compared } from './interfaces/interfaces'
import type { IOSSettings, OS } from './interfaces/os.interfaces'
import { createChromeConfig, createStore } from './test.utils'
import { detectOperatingSystem, sortDescendingMappedVersions, compareComparableVersions, sortAscendingMappedVersions, isTextFunction, sortStoreEntries } from './utils'

describe('utils', () => {

    describe('detectOperatingSystem', () => {
        it('should return linux 64-bit', () => {
            const config = createChromeConfig({
                os: 'linux',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return linux 32-bit', () => {
            const config = createChromeConfig({
                os: 'linux',
                arch: 'x86',
            })

            const expectedOSSettings: IOSSettings = {
                url: 'Linux',
                filename: 'linux'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return windows 64-bit', () => {
            const config = createChromeConfig({
                os: 'win',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Win_x64',
                filename: 'win'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return windows 32-bit', () => {
            const config = createChromeConfig({
                os: 'win',
                arch: 'x86',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Win',
                filename: 'win'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return mac 64-Bit', () => {
            const config = createChromeConfig({
                os: 'mac',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Mac',
                filename: 'mac'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return mac ARM', () => {
            const config = createChromeConfig({
                os: 'mac',
                arch: 'arm',
            })

            const expectedOSSettings: IOSSettings = {
                url: 'Mac_Arm',
                filename: 'mac'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should throw an error on unknown os received', () => {
            const config = createChromeConfig({
                os: 'foo' as unknown as OS,
            })
            expect(() => {
                detectOperatingSystem(config)
            }).toThrow(new Error('Unsupported operation system: foo'))
        })
    })

    describe('sortDescendingMappedVersions', () => {

        let versionMajor1: MappedVersion
        let versionMajor2: MappedVersion
        let versionMinor: MappedVersion
        let versionBranch: MappedVersion
        let versionPatch: MappedVersion
        let versionInfinity: MappedVersion

        beforeEach(() => {
            versionMajor1 = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMajor2 = new MappedVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMinor = new MappedVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionBranch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
                disabled: false
            })
            versionPatch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
                disabled: false
            })
            versionInfinity = new MappedVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
        })

        it('should sort the MappedVersion arrays accordingly', () => {
            expect([versionMajor1, versionMajor2].sort(sortDescendingMappedVersions)).toEqual([versionMajor2, versionMajor1])
            expect([versionMajor2, versionMajor1].sort(sortDescendingMappedVersions)).toEqual([versionMajor2, versionMajor1])

            expect([versionMajor1, versionMajor1].sort(sortDescendingMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortDescendingMappedVersions)).toEqual([versionMinor, versionMajor1])
            expect([versionMajor1, versionBranch].sort(sortDescendingMappedVersions)).toEqual([versionBranch, versionMajor1])
            expect([versionMajor1, versionPatch].sort(sortDescendingMappedVersions)).toEqual([versionPatch, versionMajor1])
            expect([versionMajor1, versionInfinity].sort(sortDescendingMappedVersions)).toEqual([versionInfinity, versionMajor1])
        })
    })

    describe('sortAscendingMappedVersions', () => {

        let versionMajor1: MappedVersion
        let versionMajor2: MappedVersion
        let versionMinor: MappedVersion
        let versionBranch: MappedVersion
        let versionPatch: MappedVersion
        let versionInfinity: MappedVersion

        beforeEach(() => {
            versionMajor1 = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMajor2 = new MappedVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMinor = new MappedVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionBranch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
                disabled: false
            })
            versionPatch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
                disabled: false
            })
            versionInfinity = new MappedVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
        })

        it('should sort the MappedVersion arrays accordingly reverse', () => {
            expect([versionMajor1, versionMajor2].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor2])
            expect([versionMajor2, versionMajor1].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor2])

            expect([versionMajor1, versionMajor1].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMinor])
            expect([versionMajor1, versionBranch].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionBranch])
            expect([versionMajor1, versionPatch].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionPatch])
            expect([versionMajor1, versionInfinity].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionInfinity])
        })
    })

    describe('compareComparableVersions', () => {
        it('should compare major versions', () => {
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(20, 0, 0, 0)
            )).toEqual(Compared.LESS)
            expect(compareComparableVersions(
                new ComparableVersion(20, 0, 0, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare minor versions', () => {
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 1, 0, 0)
            )).toEqual(Compared.LESS)
            expect(compareComparableVersions(
                new ComparableVersion(10, 1, 0, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare branch versions', () => {
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 0, 1, 0)
            )).toEqual(Compared.LESS)
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 1, 0),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare patch versions', () => {
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 0, 0),
                new ComparableVersion(10, 0, 0, 1)
            )).toEqual(Compared.LESS)
            expect(compareComparableVersions(
                new ComparableVersion(10, 0, 0, 1),
                new ComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare equal versions', () => {
            expect(compareComparableVersions(
                new ComparableVersion(10, 1, 2, 3),
                new ComparableVersion(10, 1, 2, 3)
            )).toEqual(Compared.EQUAL)
        })
    })

    describe('mapOS', () => {
        //
    })

    describe('sortStoreEntries', () => {
        it('should sort the store entries', () => {
            const unsortedWin = createStore({
                win: {
                    x64: ['10.0.0.0', '9.0.0.0'],
                    x86: ['10.0.0.1', '10.0.0.0']
                }
            })

            const sortedWin = createStore({
                win: {
                    x64: ['9.0.0.0', '10.0.0.0'],
                    x86: ['10.0.0.0', '10.0.0.1']
                }
            })
            expect(sortStoreEntries(unsortedWin)).toEqual(sortedWin)
        })

        it('should sort all os', () => {
            const unsortedAll = createStore({
                win: {
                    x64: ['10.0.0.0', '9.0.0.0'],
                    x86: ['10.0.0.1', '10.0.0.0']
                },
                linux: {
                    x64: ['100.0.0.0', '90.0.0.0'],
                    x86: ['50.0.0.1', '60.0.0.0']
                },
                mac: {
                    x64: ['10.11.0.0', '10.0.0.0'],
                    arm: ['10.0.0.1', '10.0.0.0']
                },
            })
            const sortedAll = createStore({
                win: {
                    x64: ['9.0.0.0', '10.0.0.0'],
                    x86: ['10.0.0.0', '10.0.0.1']
                },
                linux: {
                    x64: ['90.0.0.0', '100.0.0.0'],
                    x86: ['50.0.0.1', '60.0.0.0']
                },
                mac: {
                    x64: ['10.0.0.0', '10.11.0.0'],
                    arm: ['10.0.0.0', '10.0.0.1']
                },
            })

            expect(sortStoreEntries(unsortedAll)).toEqual(sortedAll)
        })
    })

    describe('isTextFunction', () => {
        it('should correctly identify a string', () => {
            expect(isTextFunction('foo')).toBe(false)
        })

        it('should correctly a TextFunction', () => {
            expect(isTextFunction(text => `text is: ${text}`)).toBe(true)
        })

        it('should correctly identify undefined', () => {
            expect(isTextFunction(undefined)).toBe(false)
        })
    })
})
