import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { detectOperatingSystem, versionToComparableVersion, sortIMappedVersions, compareIComparableVersions } from './utils'
import { logger, LoggerSpinner } from './loggerSpinner'
import { createChromeConfig, createIComparableVersion } from './test.utils'
import { IMappedVersion, Compared } from './interfaces'

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

    describe('versionToComparableVersion', () => {
        it('should map the versions accordingly', () => {
            expect(versionToComparableVersion('10.0.0.0')).toEqual({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            })
            expect(versionToComparableVersion('10.20.30.40')).toEqual({
                major: 10,
                minor: 20,
                branch: 30,
                patch: 40,
            })
            expect(versionToComparableVersion('10.0.1000.2')).toEqual({
                major: 10,
                minor: 0,
                branch: 1000,
                patch: 2,
            })
            expect(versionToComparableVersion('10.0.0.100')).toEqual({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 100,
            })
            expect(versionToComparableVersion('100.0.0.1')).toEqual({
                major: 100,
                minor: 0,
                branch: 0,
                patch: 1,
            })
        })
    })

    describe('sortIMappedVersions', () => {

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
                comparable: createIComparableVersion(10, 0, 0, 0)
            }
            versionMajor2 = {
                value: '',
                disabled: false,
                comparable: createIComparableVersion(20, 0, 0, 0)
            }
            versionMinor = {
                value: '',
                disabled: false,
                comparable: createIComparableVersion(10, 1, 0, 0)
            }
            versionBranch = {
                value: '',
                disabled: false,
                comparable: createIComparableVersion(10, 0, 1, 0)
            }
            versionPatch = {
                value: '',
                disabled: false,
                comparable: createIComparableVersion(10, 0, 0, 1)
            }
            versionInfinity = {
                value: '',
                disabled: false,
                comparable: createIComparableVersion(Infinity, 0, 0, 0)
            }
        })

        it('should sort the IMappedVersion arrays accordingly', () => {
            expect([versionMajor1, versionMajor2].sort(sortIMappedVersions)).toEqual([versionMajor2, versionMajor1])
            expect([versionMajor2, versionMajor1].sort(sortIMappedVersions)).toEqual([versionMajor2, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortIMappedVersions)).toEqual([versionMinor, versionMajor1])
            expect([versionMajor1, versionBranch].sort(sortIMappedVersions)).toEqual([versionBranch, versionMajor1])
            expect([versionMajor1, versionPatch].sort(sortIMappedVersions)).toEqual([versionPatch, versionMajor1])
            expect([versionMajor1, versionInfinity].sort(sortIMappedVersions)).toEqual([versionInfinity, versionMajor1])
        })
    })

    describe('compareIComparableVersions', () => {
        it('should compare major versions', () => {
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 0, 0),
                createIComparableVersion(20, 0, 0, 0)
            )).toEqual(Compared.LESS)
            expect(compareIComparableVersions(
                createIComparableVersion(20, 0, 0, 0),
                createIComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare minor versions', () => {
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 0, 0),
                createIComparableVersion(10, 1, 0, 0)
            )).toEqual(Compared.LESS)
            expect(compareIComparableVersions(
                createIComparableVersion(10, 1, 0, 0),
                createIComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare branch versions', () => {
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 0, 0),
                createIComparableVersion(10, 0, 1, 0)
            )).toEqual(Compared.LESS)
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 1, 0),
                createIComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare patch versions', () => {
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 0, 0),
                createIComparableVersion(10, 0, 0, 1)
            )).toEqual(Compared.LESS)
            expect(compareIComparableVersions(
                createIComparableVersion(10, 0, 0, 1),
                createIComparableVersion(10, 0, 0, 0)
            )).toEqual(Compared.GREATER)
        })

        it('should compare equal versions', () => {
            expect(compareIComparableVersions(
                createIComparableVersion(10, 1, 2, 3),
                createIComparableVersion(10, 1, 2, 3)
            )).toEqual(Compared.EQUAL)
        })
    })

    describe('sortStoreEntries', () => {
        //
    })
})
