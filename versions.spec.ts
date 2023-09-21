/**
 * Tests versions file
 * 
 * @group unit/file/versions
 */

import { parse } from 'node-html-parser'
import type { HTMLElement as NodeParserHTMLElement, Node as NodeParserNode } from 'node-html-parser'

import { fetchBranchPosition, fetchChromeUrl, fetchChromiumTags } from './api'
import { ComparableVersion } from './commons/ComparableVersion'
import { SEARCH_BINARY } from './commons/loggerTexts'
import { MappedVersion } from './commons/MappedVersion'
import type { GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import { logger, Logger } from './log/logger'
import { Spinner, spinner } from './log/spinner'
import { userSelectedVersion } from './select'
import { Store } from './store/Store'
import { storeNegativeHit } from './store/storeNegativeHit'
import { createNodeParserHTMLElement, createNodeWithChildren, createStore, createChromeSingleConfig, createChromeFullConfig } from './test/test.utils'
import { detectOperatingSystem } from './utils'
// eslint-disable-next-line import/no-namespace
import * as utils from './utils'
import { mapVersions, getChromeDownloadUrl, loadVersions } from './versions'

jest.mock('node-html-parser')
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
        let fetchBranchPositionMock: jest.MaybeMocked<typeof fetchBranchPosition>
        let fetchChromeUrlMock: jest.MaybeMocked<typeof fetchChromeUrl>
        let userSelectedVersionMock: jest.MaybeMocked<typeof userSelectedVersion>
        let storeNegativeHitMock: jest.MaybeMocked<typeof storeNegativeHit>

        let version1: MappedVersion
        let version2: MappedVersion
        let version3: MappedVersion
        let version4: MappedVersion
        let versionDisabled: MappedVersion
        let versionDisabled2: MappedVersion
        let versionDisabled3: MappedVersion

        const CHROME_URL = 'chrome-url'
        const FILENAME_OS = 'linux'

        const OS_SETTINGS: OSSetting = {
            url: 'Linux_x64',
            filename: FILENAME_OS,
        }

        const BRANCH_POSITION = 'branch-position'

        beforeEach(() => {
            version1 = new MappedVersion(10, 0, 0, 0, false)
            version2 = new MappedVersion(20, 0, 0, 0, false)
            version3 = new MappedVersion(30, 0, 0, 0, false)
            version4 = new MappedVersion(40, 2, 0, 0, false)
            versionDisabled = new MappedVersion(40, 0, 0, 0, true)
            versionDisabled2 = new MappedVersion(40, 1, 0, 0, true)
            versionDisabled3 = new MappedVersion(40, 2, 0, 0, true)

            loggerMock = jest.mocked(logger)
            loggerMock.info.mockClear()
            loggerMock.warn.mockClear()

            spinnerMock = jest.mocked(spinner)
            spinnerMock.start.mockClear()
            spinnerMock.success.mockClear()
            spinnerMock.error.mockClear()

            detectOperatingSystemMock = jest.mocked(detectOperatingSystem)
            fetchBranchPositionMock = jest.mocked(fetchBranchPosition)
            fetchChromeUrlMock = jest.mocked(fetchChromeUrl)
            userSelectedVersionMock = jest.mocked(userSelectedVersion)
            storeNegativeHitMock = jest.mocked(storeNegativeHit)

            detectOperatingSystemMock.mockReset()
            fetchBranchPositionMock.mockReset()
            fetchChromeUrlMock.mockReset()
            userSelectedVersionMock.mockReset()
            storeNegativeHitMock.mockReset()

            detectOperatingSystemMock.mockReturnValue(OS_SETTINGS)
            userSelectedVersionMock.mockResolvedValue(version1)
            fetchBranchPositionMock.mockResolvedValue(BRANCH_POSITION)
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
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledWith('Auto-searching with version 10.0.0.0')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: versionDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            userSelectedVersionMock.mockResolvedValue(versionDisabled)

            expect(await getChromeDownloadUrl(config, [version1, versionDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(1)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "10.0.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, versionDisabled], config)

            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: versionDisabled,
                    },
                ],
                selectedVersion: undefined,
            }

            userSelectedVersionMock.mockResolvedValue(versionDisabled)

            expect(await getChromeDownloadUrl(config, [versionDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(0)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([versionDisabled], config)

            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(0)
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
                        version: versionDisabled,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: versionDisabled2,

                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: new MappedVersion(versionDisabled3.comparable, false),
                    }
                ],
                selectedVersion: version4,
            }

            userSelectedVersionMock.mockResolvedValue(versionDisabled)

            expect(await getChromeDownloadUrl(config, [version4, versionDisabled2, versionDisabled])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledTimes(1)
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "40.2.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version4, versionDisabled2, versionDisabled], config)

            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version4.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: versionDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            userSelectedVersionMock.mockResolvedValue(versionDisabled)

            expect(await getChromeDownloadUrl(config, [versionDisabled, version1])).toEqual(expectedSettings)

            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next lower version "10.0.0.0"')

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([versionDisabled, version1], config)

            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
            userSelectedVersionMock.mockResolvedValue(versionDisabled   )

            await getChromeDownloadUrl(config, [versionDisabled, version1])
            expect(loggerMock.info).toHaveBeenCalledWith('Continue with next higher version "10.0.0.0"')
        })

        it('should log "Continue with next lower version" on --increase-on-fail and --inverse', async () => {
            const config = createChromeFullConfig({
                interactive: true,
                onFail: 'increase',
                download: true,
                inverse: true,
            })
            userSelectedVersionMock.mockResolvedValue(versionDisabled)

            await getChromeDownloadUrl(config, [version1, versionDisabled])

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
                        version: versionDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            userSelectedVersionMock.mockResolvedValueOnce(versionDisabled)

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
            
            const version = new MappedVersion(20, 0, 0, 0, false)

            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: CHROME_URL,
                filenameOS: FILENAME_OS,
                report: [
                    {
                        binaryExists: false,
                        download: true,
                        version: version,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            const disableSpy = jest.spyOn(version, 'disable')

            userSelectedVersionMock.mockResolvedValueOnce(version)
            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, version])).toEqual(expectedSettings)

            expect(disableSpy).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(version.comparable, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: version1,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: versionDisabled,
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version3,
                    }
                ],
                selectedVersion: version3,
            }

            userSelectedVersionMock.mockReset()
            userSelectedVersionMock.mockResolvedValue(version1)

            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')

            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, versionDisabled, version3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(1)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, versionDisabled, version3], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: new MappedVersion(version2.comparable, true),
                    },
                    {
                        binaryExists: true,
                        download: true,
                        version: version1,
                    },
                ],
                selectedVersion: version1,
            }

            userSelectedVersionMock.mockResolvedValueOnce(version2)
            fetchBranchPositionMock.mockResolvedValueOnce('branch-position2')
            fetchChromeUrlMock.mockResolvedValueOnce(undefined)

            expect(await getChromeDownloadUrl(config, [version1, version2])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(2)
            expect(userSelectedVersionMock).toHaveBeenCalledWith([version1, version2], config)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(2)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(2)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith('branch-position2', OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                        version: versionDisabled,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: versionDisabled2,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: versionDisabled3,
                    },
                ],
                selectedVersion: undefined,
            }

            expect(await getChromeDownloadUrl(config, [versionDisabled, versionDisabled2, versionDisabled3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(0)
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
                        version: version1,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: version2,
                    },
                    {
                        binaryExists: false,
                        download: true,
                        version: version3,
                    },
                ],
                selectedVersion: undefined,
            }
            const BRANCH_POSITION2 = 'branch-position2'
            const BRANCH_POSITION3 = 'branch-position3'

            fetchChromeUrlMock.mockReset()
            fetchChromeUrlMock.mockResolvedValue(undefined)
            fetchBranchPositionMock.mockReset()
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION2)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION3)

            expect(await getChromeDownloadUrl(config, [version1, version2, version3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(3)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION2, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION3, OS_SETTINGS)

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
                        version: version1,
                    },
                    {
                        binaryExists: true,
                        download: false,
                        version: version2,
                    },
                    {
                        binaryExists: true,
                        download: false,
                        version: version3,
                    },
                ],
                selectedVersion: undefined,
            }
            const BRANCH_POSITION2 = 'branch-position2'
            const BRANCH_POSITION3 = 'branch-position3'

            fetchBranchPositionMock.mockReset()
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION2)
            fetchBranchPositionMock.mockResolvedValueOnce(BRANCH_POSITION3)

            expect(await getChromeDownloadUrl(config, [version1, version2, version3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(0)
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(3)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version3.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version2.value)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(version1.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(3)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION2, OS_SETTINGS)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION3, OS_SETTINGS)

            expect(spinnerMock.start).toHaveBeenCalledTimes(3)
            expect(spinnerMock.start.mock.calls).toEqual([[SEARCH_BINARY], [SEARCH_BINARY], [SEARCH_BINARY]])
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should return undefined, is config.single and no binary was found', async () => {
            const singleVersion = new ComparableVersion(10, 11, 12, 13)

            const mappedSingleVersion = new MappedVersion(singleVersion, false)

            const config = createChromeSingleConfig({
                single: singleVersion,
            })
            const expectedSettings: GetChromeDownloadUrlReturn = {
                chromeUrl: undefined,
                filenameOS: FILENAME_OS,
                report: [{
                    binaryExists: false,
                    download: true, 
                    version: new MappedVersion(singleVersion, true)
                }],
                selectedVersion: mappedSingleVersion,
            }

            fetchChromeUrlMock.mockResolvedValue(undefined)

            expect(await getChromeDownloadUrl(config, [mappedSingleVersion, version2, version3])).toEqual(expectedSettings)

            expect(storeNegativeHitMock).toHaveBeenCalledTimes(1)
            expect(storeNegativeHitMock).toHaveBeenCalledWith(mappedSingleVersion.comparable, 'linux', 'x64')
            expect(detectOperatingSystemMock).toHaveBeenCalledTimes(1)
            expect(detectOperatingSystemMock).toHaveBeenCalledWith(config)
            expect(userSelectedVersionMock).toHaveBeenCalledTimes(0)
            expect(fetchBranchPositionMock).toHaveBeenCalledTimes(1)
            expect(fetchBranchPositionMock).toHaveBeenCalledWith(mappedSingleVersion.value)
            expect(fetchChromeUrlMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeUrlMock).toHaveBeenCalledWith(BRANCH_POSITION, OS_SETTINGS)

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
                selectedVersion: undefined,
            }

            expect(await getChromeDownloadUrl(config, [])).toEqual(expectedSettings)

            expect(spinnerMock.start).toHaveBeenCalledTimes(0)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })
    })

    describe('loadVersions', () => {

        const childNodeWithoutVersions = createNodeWithChildren()

        const childNodeWithOneVerions = createNodeWithChildren({
            text: '10.0.0.0',
        })

        const childNodeWithThreeVerions = createNodeWithChildren(
            { text: '10.0.0.0' },
            { text: '10.0.0.1' },
            { text: '10.0.0.3' })

        let fetchChromiumTagsMock: jest.MaybeMocked<typeof fetchChromiumTags>
        let parseMock: jest.MaybeMocked<typeof parse>
        let querySelectorMock: jest.Mock

        const someHTML = '<html><body><h1>some html</h1></body></html>'

        beforeAll(() => {
            fetchChromiumTagsMock = jest.mocked(fetchChromiumTags)
            parseMock = jest.mocked(parse)
            querySelectorMock = jest.fn()
        })

        beforeEach(() => {
            fetchChromiumTagsMock.mockClear()
            parseMock.mockClear()
        })

        it('should return an empty versions list', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Tags',
                        parentNode: {
                            childNodes: [null, childNodeWithoutVersions],
                        } as NodeParserNode
                    } as NodeParserHTMLElement)
                }
            })

            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            const versions = await loadVersions()

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)

            expect(versions).toEqual([])
        })

        it('should return one version', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Tags',
                        parentNode: {
                            childNodes: [null, childNodeWithOneVerions],
                        } as NodeParserNode,
                    } as NodeParserHTMLElement)
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            const versions = await loadVersions()

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)

            expect(versions).toEqual(['10.0.0.0'])
        })

        it('should return three versions', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Tags',
                        parentNode: {
                            childNodes: [null, childNodeWithThreeVerions],
                        } as NodeParserNode,
                    } as NodeParserHTMLElement)
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            const versions = await loadVersions()

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)

            expect(versions).toEqual(['10.0.0.0', '10.0.0.1', '10.0.0.3'])
        })

        it('should ignore other headlines than "tags"', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({

                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Branches',
                        parentNode: {
                            childNodes: [null, childNodeWithThreeVerions]
                        } as NodeParserNode
                    } as NodeParserHTMLElement)
                    callback({
                        innerHTML: 'Tags',
                        parentNode: {
                            childNodes: [null, childNodeWithOneVerions]
                        } as NodeParserNode
                    } as NodeParserHTMLElement,
                    )
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            const versions = await loadVersions()

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)

            expect(versions).toEqual(['10.0.0.0'])
        })

        it('should reject with an error on no headline found', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Branches',
                        parentNode: {
                            childNodes: [null, childNodeWithThreeVerions]
                        } as NodeParserNode
                    } as NodeParserHTMLElement)
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            await expect(() => loadVersions()).rejects.toEqual(new Error('Tags headline not found in HTML'))

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)
        })

        it('should reject with an error on no parentNodes found', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Tags',
                    } as NodeParserHTMLElement)
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            await expect(() => loadVersions()).rejects.toEqual(new Error('No list of tags found under tags headline'))

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)
        })

        it('should reject with an error on no childNodes found', async () => {
            fetchChromiumTagsMock.mockResolvedValue(someHTML)
            querySelectorMock.mockReturnValue({
                forEach: (callback: (e: NodeParserHTMLElement) => void) => {
                    callback({
                        innerHTML: 'Tags',
                        parentNode: {},
                    } as NodeParserHTMLElement)
                }
            })
            parseMock.mockReturnValue(createNodeParserHTMLElement(querySelectorMock))

            await expect(() => loadVersions()).rejects.toEqual(new Error('No list of tags found under tags headline'))

            expect(parseMock).toHaveBeenCalledTimes(1)
            expect(parseMock).toHaveBeenCalledWith(someHTML)
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
