import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { detectOperatingSystem, sortDescendingIMappedVersions, compareComparableVersions, sortAscendingIMappedVersions, sortStoreEntries, isTextFunction } from './utils'
import { logger, LoggerSpinner } from './loggerSpinner'
import { createChromeConfig, createStore } from './test.utils'
import { IMappedVersion, Compared } from './interfaces'
import { ComparableVersion } from './commons/ComparableVersion'

jest.mock('./loggerSpinner')

describe('utils', () => {

    let loggerMock: MaybeMockedDeep<LoggerSpinner>

    beforeEach(() => {
        loggerMock = mocked(logger, true)
        loggerMock.warn.mockClear()
    })

    describe('detectOperatingSystem', () => {
        it('should return linux 64-bit', () => {
            const config = createChromeConfig({
                os: 'linux',
                arch: 'x64',
            })

            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Linux_x64')
            expect(file).toEqual('linux')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return linux 32-bit', () => {
            const config = createChromeConfig({
                os: 'linux',
                arch: 'x86',
            })

            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Linux')
            expect(file).toEqual('linux')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return windows 64-bit', () => {
            const config = createChromeConfig({
                os: 'win',
                arch: 'x64',
            })

            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Win_x64')
            expect(file).toEqual('win')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return windows 32-bit', () => {
            const config = createChromeConfig({
                os: 'win',
                arch: 'x86',
            })
            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Win')
            expect(file).toEqual('win')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return mac 64-Bit', () => {
            const config = createChromeConfig({
                os: 'mac',
                arch: 'x64',
            })
            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Mac')
            expect(file).toEqual('mac')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return mac 64-bit for 32-bit request and logging warning', () => {
            const config = createChromeConfig({
                os: 'mac',
                arch: 'x86',
            })
            const [url, file] = detectOperatingSystem(config)

            expect(url).toEqual('Mac')
            expect(file).toEqual('mac')
            expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        })
    })

    describe('sortDescendingIMappedVersions', () => {

        let versionMajor1: IMappedVersion
        let versionMajor2: IMappedVersion
        let versionMinor: IMappedVersion
        let versionBranch: IMappedVersion
        let versionPatch: IMappedVersion
        let versionInfinity: IMappedVersion

        beforeEach(() => {
            versionMajor1 = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 0, 0)
            }
            versionMajor2 = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(20, 0, 0, 0)
            }
            versionMinor = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 1, 0, 0)
            }
            versionBranch = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 1, 0)
            }
            versionPatch = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 0, 1)
            }
            versionInfinity = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(Infinity, 0, 0, 0)
            }
        })

        it('should sort the IMappedVersion arrays accordingly', () => {
            expect([versionMajor1, versionMajor2].sort(sortDescendingIMappedVersions)).toEqual([versionMajor2, versionMajor1])
            expect([versionMajor2, versionMajor1].sort(sortDescendingIMappedVersions)).toEqual([versionMajor2, versionMajor1])

            expect([versionMajor1, versionMajor1].sort(sortDescendingIMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortDescendingIMappedVersions)).toEqual([versionMinor, versionMajor1])
            expect([versionMajor1, versionBranch].sort(sortDescendingIMappedVersions)).toEqual([versionBranch, versionMajor1])
            expect([versionMajor1, versionPatch].sort(sortDescendingIMappedVersions)).toEqual([versionPatch, versionMajor1])
            expect([versionMajor1, versionInfinity].sort(sortDescendingIMappedVersions)).toEqual([versionInfinity, versionMajor1])
        })
    })

    describe('sortAscendingIMappedVersions', () => {

        let versionMajor1: IMappedVersion
        let versionMajor2: IMappedVersion
        let versionMinor: IMappedVersion
        let versionBranch: IMappedVersion
        let versionPatch: IMappedVersion
        let versionInfinity: IMappedVersion

        beforeEach(() => {
            versionMajor1 = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 0, 0)
            }
            versionMajor2 = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(20, 0, 0, 0)
            }
            versionMinor = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 1, 0, 0)
            }
            versionBranch = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 1, 0)
            }
            versionPatch = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(10, 0, 0, 1)
            }
            versionInfinity = {
                value: '',
                disabled: false,
                comparable: new ComparableVersion(Infinity, 0, 0, 0)
            }
        })

        it('should sort the IMappedVersion arrays accordingly reverse', () => {
            expect([versionMajor1, versionMajor2].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionMajor2])
            expect([versionMajor2, versionMajor1].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionMajor2])

            expect([versionMajor1, versionMajor1].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionMinor])
            expect([versionMajor1, versionBranch].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionBranch])
            expect([versionMajor1, versionPatch].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionPatch])
            expect([versionMajor1, versionInfinity].sort(sortAscendingIMappedVersions)).toEqual([versionMajor1, versionInfinity])
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
    
            const sortedWin= createStore({
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
                    x86: ['10.0.0.1', '10.0.0.0']
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
                    x86: ['10.0.0.0', '10.0.0.1']
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
