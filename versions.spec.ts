/**
 * Tests versions file
 *
 * @group unit/file/versions
 */

import type { Logger, Spinner } from 'yalpt'
import { logger, spinner } from 'yalpt'

import { fetchChromeUrl } from './api'
import { ComparableVersion } from './commons/ComparableVersion'
import { SEARCH_BINARY } from './commons/loggerTexts'
import type { GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import type { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
import { createChromeSingleConfig, createChromeFullConfig } from './test/test.utils'
import { detectOperatingSystem } from './utils'
// eslint-disable-next-line import/no-namespace
import type * as utils from './utils'
import { getChromeDownloadUrl } from './versions'

jest.mock('./select')
jest.mock('./api')
jest.mock('yalpt')

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

        let release1: Release
        let release2: Release
        let release3: Release
        let release4: Release

        const CHROME_URL = 'chrome-url'
        const FILENAME_OS = 'linux'

        const OS_SETTINGS: OSSetting = {
            url: 'Linux_x64',
            filename: FILENAME_OS,
        }

        beforeEach(() => {
            release1 = {
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 0),
            }
            release2 = {
                branchPosition: 456,
                version: new ComparableVersion(20, 0, 0, 0),
            }
            release3 = {
                branchPosition: 789,
                version: new ComparableVersion(30, 0, 0, 0),
            }
            release4 = {
                branchPosition: 890,
                version: new ComparableVersion(40, 2, 0, 0),
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

            detectOperatingSystemMock.mockReset()
            fetchChromeUrlMock.mockReset()
            userSelectedVersionMock.mockReset()

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

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1, release2], config, new Set())
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
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)
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
                        release: release1,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release2,
                    },
                ],
                selectedRelease: release2,
            }

            userSelectedVersionMock.mockResolvedValue(release1)

            expect(await getChromeDownloadUrl(config, [release2, release1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(1)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "20.0.0.0"')

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release2, release1], config, new Set())

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
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
                        release: release1,
                    },
                ],
                selectedRelease: undefined,
            }

            userSelectedVersionMock.mockResolvedValue(release1)
            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [release1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(0)

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release1], config, new Set())

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)

            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
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
                        release: release1,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        release: release2,

                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: {
                            version: release4.version,
                            branchPosition: release4.branchPosition,
                        },
                    }
                ],
                selectedRelease: release4,
            }

            fetchChromeUrlMock.mockResolvedValueOnce(undefined)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            userSelectedVersionMock.mockResolvedValue(release1)

            expect(await getChromeDownloadUrl(config, [release4, release2, release1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(2)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "20.0.0.0"')
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "40.2.0.0"')

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release4, release2, release1], config, new Set())

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release4.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(2)
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
                        release: release2,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        release: release1,
                    },
                ],
                selectedRelease: release1,
            }

            userSelectedVersionMock.mockResolvedValue(release2)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [release2, release1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next lower version "10.0.0.0"')

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([release2, release1], config, new Set())

            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
        })

        it('should log "Continue with next higher version" on --decrease-on-fail and --inverse', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'decrease',
                download: true,
                inverse: true,
            })
            userSelectedVersionMock.mockResolvedValue(release2)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            await getChromeDownloadUrl(config, [release2, release1])
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "10.0.0.0"')
        })

        it('should log "Continue with next lower version" on --increase-on-fail and --inverse', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
                inverse: true,
            })
            userSelectedVersionMock.mockResolvedValue(release1)
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            await getChromeDownloadUrl(config, [release2, release1])

            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next lower version "20.0.0.0"')

            expect(spinnerMock.start).toHaveBeenCalledTimes(2)
            expect(spinnerMock.start).toHaveBeenCalledWith(SEARCH_BINARY)
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
            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [release1, release2, release3])).toEqual(expectedSettings)

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(3)
        })

        it('should return null, if --decrease-on-fail reaches the end of versions on versions without binary', async () => {
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

            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release1.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release2.branchPosition, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(release3.branchPosition, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(3)
            expect(spinnerMock.success.mock.calls).toEqual([[], [], []])
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should return undefined, is config.single and no binary was found', async () => {
            const singleVersion = new ComparableVersion(10, 11, 12, 13)

            const mappedSingleRelease: Release = {
                version: singleVersion,
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
                        version: singleVersion,
                        branchPosition: 123,
                    }
                }],
                selectedRelease: mappedSingleRelease,
            }

            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [mappedSingleRelease, release2, release3])).toEqual(expectedSettings)

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
})
