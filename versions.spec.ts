import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { LoggerSpinner, logger } from './loggerSpinner'
import { mapVersions, getChromeDownloadUrl } from './versions'
import { IMappedVersion } from './interfaces'
import { createChromeConfig, createIComparableVersion } from './test.utils'
import { userSelectedVersion } from './select'
import { fetchBranchPosition, fetchChromeUrl } from './api'
import { detectOperatingSystem } from './utils'
import { storeNegativeHit } from './store/store'

jest.mock('./select')
jest.mock('./api')
jest.mock('./loggerSpinner')
jest.mock('./store/store')

// don't mock versionToComparableVersion to test the sort and filtering based on version.comparableVersion
jest.mock('./utils', () => ({
    ...jest.requireActual<any>('./utils'),
    detectOperatingSystem: jest.fn(),
}))

describe('versions', () => {
    describe('getChromeDownloadUrl', () => {
        let loggerMock: MaybeMockedDeep<LoggerSpinner>
        let detectOperatingSystemMock: any
        let fetchBranchPositionMock: any
        let fetchChromeUrlMock: any
        let userSelectedVersionMock: any
        let storeNegativeHitMock: any

        let version1: IMappedVersion
        let version2: IMappedVersion
        let version3: IMappedVersion
        let versionDisabled: IMappedVersion
        let versionDisabled2: IMappedVersion
        let versionDisabled3: IMappedVersion

        const CHROME_URL = 'chrome-url'
        const URL_OS = 'url-os'
        const FILENAME_OS = 'filename-os'
        const BRANCH_POSITION = 'branch-position'

        beforeEach(() => {
            version1 = {
                comparable: createIComparableVersion(10, 0, 0, 0),
                disabled: false,
                value: '10.0.0.0',
            }
            version2 = {
                comparable: createIComparableVersion(20, 0, 0, 0),
                disabled: false,
                value: '20.0.0.0',
            }
            version3 = {
                comparable: createIComparableVersion(30, 0, 0, 0),
                disabled: false,
                value: '30.0.0.0',
            }
            versionDisabled = {
                comparable: createIComparableVersion(40, 0, 0, 0),
                disabled: true,
                value: '40.0.0.0',
            }
            versionDisabled2 = {
                comparable: createIComparableVersion(40, 1, 0, 0),
                disabled: true,
                value: '40.1.0.0',
            }
            versionDisabled3 = {
                comparable: createIComparableVersion(40, 2, 0, 0),
                disabled: true,
                value: '40.2.0.0',
            }

            loggerMock = mocked(logger, true)
            loggerMock.start.mockClear()
            loggerMock.info.mockClear()
            loggerMock.success.mockClear()
            loggerMock.error.mockClear()
            loggerMock.warn.mockClear()

            detectOperatingSystemMock = mocked(detectOperatingSystem)
            fetchBranchPositionMock = mocked(fetchBranchPosition)
            fetchChromeUrlMock = mocked(fetchChromeUrl)
            userSelectedVersionMock = mocked(userSelectedVersion)
            storeNegativeHitMock = mocked(storeNegativeHit)

            detectOperatingSystemMock.mockReset()
            fetchBranchPositionMock.mockReset()
            fetchChromeUrlMock.mockReset()
            userSelectedVersionMock.mockReset()
            storeNegativeHitMock.mockReset()

            detectOperatingSystemMock.mockReturnValue([URL_OS, FILENAME_OS])
            userSelectedVersionMock.mockResolvedValue(version1)
            fetchBranchPositionMock.mockResolvedValue(BRANCH_POSITION)
            fetchChromeUrlMock.mockResolvedValue(CHROME_URL)
        })

        it('should return the chrome url for the user selected version', async () => {
            const config = createChromeConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
            })

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual([CHROME_URL, version1.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should return the chrome url for the automatically selected first mapped version', async () => {
            const config = createChromeConfig({
                interactive: false,
                onFail: 'decrease',
                download: true,
            })

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual([CHROME_URL, version1.value, FILENAME_OS])

            expect(loggerMock.info).toHaveBeenCalledWith('Auto-searching with version 10.0.0.0')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should request a user selected version twice and return the chrome url on first version disabled', async () => {
            const config = createChromeConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
            })

            userSelectedVersionMock.mockReturnValueOnce(versionDisabled)

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual([CHROME_URL, version1.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should mark a version as disabled and request a user selected version twice on no binary found', async () => {
            const config = createChromeConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: true,
            })

            userSelectedVersionMock.mockResolvedValueOnce(version2)
            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual([CHROME_URL, version1.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(version2, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should skip a already disabled version on --decrease-on-fail when selecting a disabled version', async () => {
            const config = createChromeConfig({
                interactive: true,
                onFail: 'decrease',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: false,
            })

            userSelectedVersionMock.mockReset()
            userSelectedVersionMock.mockResolvedValue(version1)

            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')
            
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, versionDisabled, version3])).toEqual([CHROME_URL, version3.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, versionDisabled, version3], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should not mark a version as disabled on store: false', async () => {
            const config = createChromeConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: false,
            })

            userSelectedVersionMock.mockResolvedValueOnce(version2)
            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual([CHROME_URL, version1.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })

        it('should return null, if --decrease-on-fail reaces the end of versions on only disabled versions', async () => {
            const config = createChromeConfig({
                interactive: false,
                onFail: 'decrease',
            })

            expect(await getChromeDownloadUrl(config, [versionDisabled, versionDisabled2, versionDisabled3])).toEqual([undefined, undefined, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(0)
        })

        it('should return null, if --decrease-on-fail reaches the end of versions on versions without binary', async () => {
            const config = createChromeConfig({
                interactive: false,
                onFail: 'decrease',
                store: false,
            })
            const BRANCH_POSITION2 = 'branch-position2'
            const BRANCH_POSITION3 = 'branch-position3'

            fetchChromeUrlMock.mockReset()
            fetchChromeUrlMock.mockReturnValue(undefined)
            fetchBranchPositionMock.mockReset()
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION2)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION3)

            expect(await getChromeDownloadUrl(config, [version1, version2, version3])).toEqual([undefined, undefined, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(3)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION2, URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION3, URL_OS, FILENAME_OS)
        })

        it('should do nothing if --decrease-on-fail reaces the end of version on --no-download and all versions with binary', async () => {
            const config = createChromeConfig({
                interactive: false,
                onFail: 'decrease',
                store: false,
                download: false,
            })
            const BRANCH_POSITION2 = 'branch-position2'
            const BRANCH_POSITION3 = 'branch-position3'

            fetchBranchPositionMock.mockReset()
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION2)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION3)

            expect(await getChromeDownloadUrl(config, [version1, version2, version3])).toEqual([CHROME_URL, undefined, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(3)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION2, URL_OS, FILENAME_OS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION3, URL_OS, FILENAME_OS)
        })

        it('should return undefined, is config.single and no binary was found', async () => {
            const singleVersion = '10.11.12.13'

            const mappedSingleVersion: IMappedVersion = {
                comparable: {
                    major: 10,
                    minor: 11,
                    branch: 12,
                    patch: 13,
                },
                disabled: false,
                value: singleVersion,
            }
            
            const config = createChromeConfig({
                single: singleVersion,
                store: true,
            })
            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [mappedSingleVersion, version2, version3])).toEqual([undefined, mappedSingleVersion.value, FILENAME_OS])

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(mappedSingleVersion, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(mappedSingleVersion.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, URL_OS, FILENAME_OS)
        })
    })

    describe('mapVersions', () => {
        it('should sort the versions', () => {
            const config = createChromeConfig()

            const mapped = mapVersions(['10.1.2.3', '20.0.0.0'], config, new Set())

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(20, 0, 0, 0),
                    disabled: false,
                    value: '20.0.0.0',
                },
                {
                    comparable: createIComparableVersion(10, 1, 2, 3),
                    disabled: false,
                    value: '10.1.2.3',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should mark versions found in store as disabled', () => {
            const config = createChromeConfig()

            const mapped = mapVersions(['10.1.2.3', '10.1.2.4'], config, new Set(['10.1.2.4']))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(10, 1, 2, 4),
                    disabled: true,
                    value: '10.1.2.4',
                },
                {
                    comparable: createIComparableVersion(10, 1, 2, 3),
                    disabled: false,
                    value: '10.1.2.3',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should remove disabled versions on hideNegativeHits set in config ', () => {
            const config = createChromeConfig({
                hideNegativeHits: true,
            })

            const mapped = mapVersions(['10.1.2.3', '10.1.2.4'], config, new Set(['10.1.2.4']))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(10, 1, 2, 3),
                    disabled: false,
                    value: '10.1.2.3',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter out versions less than config.min', () => {
            const config = createChromeConfig({
                min: createIComparableVersion(30, 0, 0, 0)
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(60, 6, 7, 8),
                    disabled: false,
                    value: '60.6.7.8',
                },
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter out versions greater than config.max', () => {
            const config = createChromeConfig({
                max: createIComparableVersion(30, 0, 0, 0),
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '30.0.0.1', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
                {
                    comparable: createIComparableVersion(29, 0, 2000, 4),
                    disabled: false,
                    value: '29.0.2000.4',
                },
                {
                    comparable: createIComparableVersion(10, 1, 2, 4),
                    disabled: false,
                    value: '10.1.2.4',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should strip the versions based to config.results', () => {
            const config = createChromeConfig({
                results: 3,
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(60, 6, 7, 8),
                    disabled: false,
                    value: '60.6.7.8',
                },
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
                {
                    comparable: createIComparableVersion(29, 0, 2000, 4),
                    disabled: false,
                    value: '29.0.2000.4',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should not strip the versions if --only-newest-major is set', () => {
            const config = createChromeConfig({
                onlyNewestMajor: true,
                results: 3,
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(60, 6, 7, 8),
                    disabled: false,
                    value: '60.6.7.8',
                },
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
                {
                    comparable: createIComparableVersion(29, 0, 2000, 4),
                    disabled: false,
                    value: '29.0.2000.4',
                },
                {
                    comparable: createIComparableVersion(10, 1, 2, 4),
                    disabled: false,
                    value: '10.1.2.4',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should return the provided version on config.single, even if it\'s marked as disabled in the store', () => {
            const config = createChromeConfig({
                single: '10.1.2.3'
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set(['10.1.2.3']))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(10, 1, 2, 3),
                    disabled: false,
                    value: '10.1.2.3',
                }
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should return an ascending list on --inverse', () => {
            const config = createChromeConfig({
                inverse: true,
            })
            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
                {
                    comparable: createIComparableVersion(10, 1, 2, 4),
                    disabled: false,
                    value: '10.1.2.4',
                },
                {
                    comparable: createIComparableVersion(29, 0, 2000, 4),
                    disabled: false,
                    value: '29.0.2000.4',
                },
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
                {
                    comparable: createIComparableVersion(60, 6, 7, 8),
                    disabled: false,
                    value: '60.6.7.8',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should first limit and then sort the results on --inverse and --max-results', () => {
            const config = createChromeConfig({
                inverse: true,
                results: 2,
            })
            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Set([]))

            const expectedVersions: IMappedVersion[] = [
            //     {
            //         comparable: createIComparableVersion(10, 1, 2, 4),
            //         disabled: false,
            //         value: '10.1.2.4',
            //     },
            //     {
            //         comparable: createIComparableVersion(29, 0, 2000, 4),
            //         disabled: false,
            //         value: '29.0.2000.4',
            //     },
                {
                    comparable: createIComparableVersion(30, 0, 0, 0),
                    disabled: false,
                    value: '30.0.0.0',
                },
                {
                    comparable: createIComparableVersion(60, 6, 7, 8),
                    disabled: false,
                    value: '60.6.7.8',
                },
            ]

            expect(mapped).toEqual(expectedVersions)
        })
    })
})
