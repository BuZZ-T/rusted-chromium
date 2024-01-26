/**
 * Tests versions file
 *
 * @group unit/file/versions
 */

import { fetchChromeUrl } from './api'
import { ComparableVersion } from './commons/ComparableVersion'
import { SEARCH_BINARY } from './commons/loggerTexts'
import { MappedVersion } from './commons/MappedVersion'
import type { GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import { logger, Logger } from './log/logger'
import { Spinner, spinner } from './log/spinner'
import { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
import { Store } from './store/Store'
import { storeNegativeHit } from './store/storeNegativeHit'
import { createStore, createChromeSingleConfig, createChromeFullConfig } from './test/test.utils'
import { detectOperatingSystem } from './utils'
// eslint-disable-next-line import/no-namespace
import * as utils from './utils'
import { mapVersions, getChromeDownloadUrl } from './versions'

jest.mock('./select')
jest.mock('./api')
jest.mock('./log/spinner')
jest.mock('./log/logger')
jest.mock('./store/storeNegativeHit')

// don't mock compareComparableVersions to test the sort and filtering based on version.comparableVersion
jest.mock('./utils', () => ({
    ...jest.requireActual<typeof utils>('./utils'),
    detectOperatingSystem: jest.fn(),
}))

describe('versions', () => {
    describe('getChromeDownloadUrl', () => {
        let loggerMock: jest.MaybeMockedDeep<Logger>
        let spinnerMock: jest.MaybeMockedDeep<Spinner>
        let detectOperatingSystemMock: jest.MaybeMocked<typeof detectOperatingSystem>
        let fetchChromeUrlMock: jest.MaybeMocked<typeof fetchChromeUrl>
        let userSelectedVersionMock: jest.MaybeMocked<typeof userSelectedVersion>
        let storeNegativeHitMock: jest.MaybeMocked<typeof storeNegativeHit>

        let release1: Release
        let release2: Release
        let release3: Release
        let release4: Release
        let releaseDisabled: Release
        let releaseDisabled2: Release
        let releaseDisabled3: Release

        const CHROME_URL = 'chrome-url'
        const FILENAME_OS = 'linux'

        const OS_SETTINGS: OSSetting = {
            url: 'Linux_x64',
            filename: FILENAME_OS,
        }

        beforeEach(() => {
            release1 = {
                branchPosition: 123,
                version: new MappedVersion(10, 0, 0, 0, false),
            }
            release2 = {
                branchPosition: 456,
                version: new MappedVersion(20, 0, 0, 0, false),
            }
            release3 = {
                branchPosition: 789,
                version: new MappedVersion(30, 0, 0, 0, false),
            }
            release4 = {
                branchPosition: 890,
                version: new MappedVersion(40, 2, 0, 0, false),
            }
            releaseDisabled = {
                branchPosition: 400,
                version: new MappedVersion(40, 0, 0, 0, true),
            }
            releaseDisabled2 = {
                branchPosition: 500,
                version: new MappedVersion(40, 1, 0, 0, true),
            }
            releaseDisabled3 = {
                branchPosition: 600,
                version: new MappedVersion(40, 3, 0, 0, true),
            }

            loggerMock = jest.mocked(logger)
            loggerMock.info.mockClear()
            loggerMock.warn.mockClear()

            spinnerMock = jest.mocked(spinner)
            spinnerMock.start.mockClear()
            spinnerMock.success.mockClear()
            spinnerMock.error.mockClear()

            detectOperatingSystemMock = jest.mocked(detectOperatingSystem)
            fetchChromeUrlMock = jest.mocked(fetchChromeUrl)
            userSelectedVersionMock = jest.mocked(userSelectedVersion)
            storeNegativeHitMock = jest.mocked(storeNegativeHit)

            detectOperatingSystemMock.mockReset()
            fetchChromeUrlMock.mockReset()
            userSelectedVersionMock.mockReset()
            storeNegativeHitMock.mockReset()

            detectOperatingSystemMock.mockReturnValue(OS_SETTINGS)
            userSelectedVersionMock.mockResolvedValue(release1)
            fetchChromeUrlMock.mockResolvedValue(CHROME_URL)
        })

        it('should return the chrome url for the user selected version', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
            })

            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            expect(await getChromeDownloadUrl(config, [release1, release2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, release2], config)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should return the chrome url for the automatically selected first mapped version on decrease', async () => {
            const config = createChromeFullConfig({
                interactive: false,
                onFail: 'decrease',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            expect(await getChromeDownloadUrl(config, [release1, release2])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledWith('Auto-searching with version 10.0.0.0')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should automatically continue with the next available higher version on --increase-on-fail', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            expect(await getChromeDownloadUrl(config, [release1, releaseDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(1)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "10.0.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, releaseDisabled], config)

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should break on no version left on --increase-on-fail', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                ],
                selectedRelease: undefined,
            }

            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            expect(await getChromeDownloadUrl(config, [releaseDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(0)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([releaseDisabled], config)

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(0)

            expect(spinnerMock.start).toHaveBeenCalledTimes(0)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should skip the next available higher version, if it\'s disabled on --increase-on-fail', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: 'chrome-url',
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled2,

                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: {
                            version: new MappedVersion(release4.version.comparable, false),
                            branchPosition: release4.branchPosition,
                        },
                    }
                ],
                selectedRelease: release4,
            }

            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            expect(await getChromeDownloadUrl(config, [release4, releaseDisabled2, releaseDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(1)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "40.2.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release4, releaseDisabled2, releaseDisabled], config)

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release4.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should automatically continue with the next available lower version on --decrease-on-fail', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'decrease',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            expect(await getChromeDownloadUrl(config, [releaseDisabled, release1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next lower version "10.0.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([releaseDisabled, release1], config)

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should log "Continue with next higher version" on --decrease-on-fail and --inverse', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'decrease',
                download: true,
                inverse: true,
            })
            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            await getChromeDownloadUrl(config, [releaseDisabled, release1])
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "10.0.0.0"')
        })

        it('should log "Continue with next lower version" on --increase-on-fail and --inverse', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
                inverse: true,
            })
            userSelectedVersionMock.mockResolvedValue(releaseDisabled)

            await getChromeDownloadUrl(config, [release1, releaseDisabled])

            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next lower version "10.0.0.0"')

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should request a user selected version twice and return the chrome url on first version disabled', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            userSelectedVersionMock.mockResolvedValueOnce(releaseDisabled)

            expect(await getChromeDownloadUrl(config, [release1, release2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, release2], config)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should mark a version as disabled and request a user selected version twice on no binary found', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: true,
            })

            const release: Release = {
                version: new MappedVersion(20, 0, 0, 0, false),
                branchPosition: 456,

            }

            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            const disableSpy = jest.spyOn(release.version, 'disable')

            userSelectedVersionMock.mockResolvedValueOnce(release)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [release1, release])).toEqual(expectedSettings)

            expect(disableSpy).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(release.version.comparable, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, release], config)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
        })

        it('should skip a already disabled version on --decrease-on-fail when selecting a disabled version', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'decrease',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: false,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: release1,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release3,
                    }
                ],
                selectedRelease: release3,
            }

            userSelectedVersionMock.mockReset()
            userSelectedVersionMock.mockResolvedValue(release1)

            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [release1, releaseDisabled, release3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, releaseDisabled, release3], config)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release3.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
        })

        it('should not mark a version as disabled on store: false', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'nothing',
                download: true,
                os: 'linux',
                arch: 'x64',
                store: false,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: {
                            version: new MappedVersion(release2.version.comparable, true),
                            branchPosition: release2.branchPosition,
                        },
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            userSelectedVersionMock.mockResolvedValueOnce(release2)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [release1, release2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, release2], config)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
        })

        it('should return null, if --decrease-on-fail reaces the end of versions on only disabled versions', async () => {
            const config = createChromeFullConfig({
                interactive: false,
                onFail: 'decrease',
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled2,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: releaseDisabled3,
                    },
                ],
                selectedRelease: undefined,
            }

            expect(await getChromeDownloadUrl(config, [releaseDisabled, releaseDisabled2, releaseDisabled3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(0)

            expect(spinnerMock.start).toHaveBeenCalledTimes(0)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should return null, if --decrease-on-fail reaches the end of versions on versions without binary', async () => {
            const config = createChromeFullConfig({
                interactive: false,
                onFail: 'decrease',
                store: false,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        release: release1,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: release2,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: release3,
                    },
                ],
                selectedRelease: undefined,
            }

            fetchChromeUrlMock.mockReset()
            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [release1, release2, release3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release3.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(3)
        })

        it('should do nothing if --decrease-on-fail reaches the end of versions on --no-download and all versions with binary', async () => {
            const config = createChromeFullConfig({
                interactive: false,
                onFail: 'decrease',
                store: false,
                download: false,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: true,
                        download: false,
                        release: release1,
                    },
                    {
                        binaryExists: true,
                        download: false,
                        release: release2,
                    },
                    {
                        binaryExists: true,
                        download: false,
                        release: release3,
                    },
                ],
                selectedRelease: undefined,
            }

            expect(await getChromeDownloadUrl(config, [release1, release2, release3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release3.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should return undefined, is config.single and no binary was found', async () => {
            const singleVersion = new ComparableVersion(10, 11, 12, 13)

            const mappedSingleRelease: Release = {
                version: new MappedVersion(singleVersion, false),
                branchPosition: 123,
            }

            const config = createChromeSingleConfig({
                single: singleVersion,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [{
                    binaryExists: false,
                    download: true,
                    release: {
                        version: new MappedVersion(singleVersion, true),
                        branchPosition: 123,
                    }
                }],
                selectedRelease: mappedSingleRelease,
            }

            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [mappedSingleRelease, release2, release3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(mappedSingleRelease.version.comparable, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
        })

        it('should return undefined on auto-search without version', async () => {
            const config = createChromeFullConfig({
                interactive: false,
                onFail: 'decrease',
            })

            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [],
                selectedRelease: undefined,
            }

            expect(await getChromeDownloadUrl(config, [])).toEqual(expectedSettings)

            expect(spinnerMock.start).toHaveBeenCalledTimes(0)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })
    })

    describe('mapVersions', () => {
        it('should sort the versions', () => {
            const config = createChromeFullConfig()

            const mapped = mapVersions(['10.1.2.3', '20.0.0.0'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion(20, 0, 0, 0, false),
                new MappedVersion(10, 1, 2, 3, false)
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should mark versions found in store as disabled', () => {
            const config = createChromeFullConfig({
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapVersions(['10.1.2.3', '10.1.2.4'], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.4'],
                    x86: []
                }
            })))

            const expectedVersions = [
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: true,
                }),
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 3,
                    disabled: false,
                })
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should remove disabled versions on hideNegativeHits set in config', () => {
            const config = createChromeFullConfig({
                hideNegativeHits: true,
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapVersions(['10.1.2.3', '10.1.2.4'], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.4'],
                    x86: []
                }
            })))

            const expectedVersions = [
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 3,
                    disabled: false,
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter out versions less than config.min', () => {
            const config = createChromeFullConfig({
                min: new ComparableVersion(30, 0, 0, 0)
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false,
                }),
                new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter out versions greater than config.max', () => {
            const config = createChromeFullConfig({
                max: new ComparableVersion(30, 0, 0, 0),
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '30.0.0.1', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
                new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false,
                }),
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false,
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should strip the versions based to config.results', () => {
            const config = createChromeFullConfig({
                results: 3,
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false
                }),
                new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false
                }),
                new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter the versions if --only-newest-major is set', () => {
            const config = createChromeFullConfig({
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '10.0.2000.4', '10.0.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false
                }),
                new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false
                }),
                new MappedVersion({
                    major: 10,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter the versions if --only-newest-major is set with version in the middle disabled', () => {
            const config = createChromeFullConfig({
                arch: 'x64',
                os: 'linux',
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapVersions(['119.0.6021.1', '119.0.6010.1', '119.0.6004.1'], config, new Store(createStore({
                linux: {
                    x64: ['119.0.6010.1'],
                    x86: [],
                },
            })))

            const expectedVersions = [
                new MappedVersion({
                    major: 119,
                    minor: 0,
                    branch: 6021,
                    patch: 1,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should filter the versions if --only-newest-major is set with the first version disabled', () => {
            const config = createChromeFullConfig({
                arch: 'x64',
                os: 'linux',
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapVersions(['119.0.6021.1', '119.0.6010.1', '119.0.6004.1'], config, new Store(createStore({
                linux: {
                    x64: ['119.0.6021.1'],
                    x86: [],
                },
            })))

            const expectedVersions = [
                new MappedVersion({
                    major: 119,
                    minor: 0,
                    branch: 6010,
                    patch: 1,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should return the provided version on config.single, even if it\'s marked as disabled in the store', () => {
            const config = createChromeSingleConfig({
                single: new ComparableVersion(10, 1, 2, 3),
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.3'],
                    x86: []
                }
            })))

            const expectedVersions = [
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 3,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should return an ascending list on --inverse', () => {
            const config = createChromeFullConfig({
                inverse: true,
            })
            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false
                }),
                new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
                new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false
                }),
                new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })

        it('should first sort, then inverse and then limit the results on --inverse and --max-results', () => {
            const config = createChromeFullConfig({
                inverse: true,
                results: 2,
            })
            const mapped = mapVersions(['60.6.7.8', '30.0.0.0', '29.0.2000.4', '10.1.2.4'], config, new Store(createStore()))

            const expectedVersions = [
                new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false
                }),
                new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            ]

            expect(mapped).toEqual(expectedVersions)
        })
    })
})
