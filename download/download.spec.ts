/**
 * Tests download file
 *
 * @group unit/file/download
 */

import type { Response as NodeFetchResponse } from 'node-fetch'
import type { Stats } from 'node:fs'
import { createWriteStream } from 'node:fs'
import { mkdir, stat, rmdir, unlink }from 'node:fs/promises'
import { DebugMode, logger, progress, spinner } from 'yalpt'

import { downloadChromium } from './download'
import { fetchChromeZipFile } from '../api'
import { ComparableVersion } from '../commons/ComparableVersion'
import { NoChromiumDownloadError } from '../errors'
import { loadReleases, mapApiReleasesToReleases } from '../releases/releases'
import { createChromeFullConfig, createGetChromeDownloadUrlReturn, createChromeSingleConfig, createApiRelease } from '../test/test.utils'
import { existsAndIsFolder } from '../utils/file.utils'
import { getChromeDownloadUrl } from '../versions'

/* eslint-disable @typescript-eslint/no-require-imports */
const extract = require('extract-zip')
const Progress = require('node-fetch-progress')
/* eslint-enable @typescript-eslint/no-require-imports */

const progressOnMock = jest.fn()

jest.mock('node:fs')
jest.mock('node:fs/promises')
jest.mock('node-fetch-progress')
jest.mock('extract-zip')

jest.mock('yalpt')
const progressMock = jest.mocked(progress)
const spinnerMock = jest.mocked(spinner)
const loggerMock = jest.mocked(logger)

jest.mock('../api')
jest.mock('../versions', () => ({
    ...jest.requireActual('../versions'),
    getChromeDownloadUrl: jest.fn(),
}))
jest.mock('../utils/file.utils')
jest.mock('../releases/releases')

const progressBarStartMock = jest.fn()
const progressBarFractionMock = jest.fn()

const progressConstructorMock = jest.mocked(Progress)
const extractMock = jest.mocked(extract)

const loadReleasesMock = jest.mocked(loadReleases)
const mapApiReleasesToReleasesMock = jest.mocked(mapApiReleasesToReleases)
const getChromeDownloadUrlMock = jest.mocked(getChromeDownloadUrl)
const fetchChromeZipFileMock = jest.mocked(fetchChromeZipFile)

const existsAndIsFolderMock = jest.mocked(existsAndIsFolder)
const createWriteStreamMock = jest.mocked(createWriteStream)
const mkdirMock = jest.mocked(mkdir)
const statMock = jest.mocked(stat)
const rmdirMock = jest.mocked(rmdir)
const unlinkMock = jest.mocked(unlink)

describe('download', () => {
    describe('downloadChromium', () => {
        let pipeMock: jest.Mock
        let onMock: jest.Mock
        let zipFileResource: NodeFetchResponse

        let processOnSpy: jest.SpyInstance
        let processExitSpy: jest.SpyInstance

        beforeAll(() => {
            pipeMock = jest.fn()
            onMock = jest.fn()
            zipFileResource = {
                body: {
                    pipe: pipeMock,
                    on: onMock,
                } as unknown as NodeJS.ReadableStream
            } as NodeFetchResponse
            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            processOnSpy = jest.spyOn(process, 'on')
            processExitSpy = jest.spyOn(process, 'exit')

            logger.silent = jest.fn()
            spinner.silent = jest.fn()
            progress.silent = jest.fn()

            logger.noColor = jest.fn()
            spinner.noColor = jest.fn()
            progress.noColor = jest.fn()

            logger.noProgress = jest.fn()
            spinner.noProgress = jest.fn()
            progress.noProgress = jest.fn()
        })

        beforeEach(() => {
            loadReleasesMock.mockReset()
            loadReleasesMock.mockResolvedValue([
                createApiRelease({version: '10.0.0.0'}),
                createApiRelease({version: '11.0.0.0'}),
                createApiRelease({version: '12.0.0.0'}),
                createApiRelease({version: '13.0.0.0'}),
                createApiRelease({version: '14.0.0.0'}),
                createApiRelease({version: '15.0.0.0'}),
            ])

            mapApiReleasesToReleasesMock.mockReset()
            mapApiReleasesToReleasesMock.mockReturnValue([
                {
                    branchPosition: 123,
                    version: new ComparableVersion('10.0.0.0'),
                },
                {
                    branchPosition: 124,
                    version: new ComparableVersion('11.0.0.0'),
                },
            ])

            getChromeDownloadUrlMock.mockReset()
            fetchChromeZipFileMock.mockReset()

            progressBarStartMock.mockReset()
            progressBarFractionMock.mockReset()

            loggerMock.info.mockReset()
            loggerMock.warn.mockReset()
            loggerMock.error.mockReset()
            loggerMock.setDebugMode.mockReset()
            loggerMock.silent.mockReset()
            loggerMock.noColor.mockReset()
            loggerMock.noProgress.mockReset()

            spinnerMock.start.mockReset()
            spinnerMock.success.mockReset()
            spinnerMock.error.mockReset()
            spinnerMock.update.mockReset()

            progressMock.start.mockReset()
            progressMock.fraction.mockReset()

            extractMock.mockReset()

            existsAndIsFolderMock.mockReset()
            createWriteStreamMock.mockReset()
            mkdirMock.mockReset()
            statMock.mockReset()
            rmdirMock.mockReset()
            unlinkMock.mockReset()

            pipeMock.mockReset()
            progressOnMock.mockReset()

            processOnSpy.mockReset()
            processExitSpy.mockReset()

            progressConstructorMock.mockReset()
            progressConstructorMock.mockReturnValue({
                on: progressOnMock,
            })

            onMock.mockClear()
            onMock.mockImplementation((eventName: string, callback: () => void) => {
                if (eventName === 'end') {
                    callback()
                }
            })
        })

        it('should fetch the zip and create the dest folder', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([
                {
                    branchPosition: 123,
                    version: new ComparableVersion(10, 0, 0, 1),
                },
            ])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)

            expect(existsAndIsFolderMock).toHaveBeenCalledTimes(1)
            expect(existsAndIsFolderMock).toHaveBeenCalledWith('down_folder')
            expect(mkdirMock).toHaveBeenCalledTimes(1)

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')

            expect(getChromeDownloadUrlMock).toHaveBeenCalledTimes(1)

            const expected = createChromeFullConfig({
                downloadFolder: 'down_folder',
            })

            expect(getChromeDownloadUrlMock).toHaveBeenCalledWith(expected, [{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 1),
            }])
        })

        it('should fetch the zip and create the dest folder on finish', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)

            expect(existsAndIsFolderMock).toHaveBeenCalledTimes(1)
            expect(existsAndIsFolderMock).toHaveBeenCalledWith('down_folder')
            expect(mkdirMock).toHaveBeenCalledTimes(1)

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')
        })

        it('should fetch the zip and not create the dest folder', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            existsAndIsFolderMock.mockResolvedValue(true)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)

            expect(mkdirMock).toHaveBeenCalledTimes(0)

            expect(existsAndIsFolderMock).toHaveBeenCalledTimes(1)
            expect(existsAndIsFolderMock).toHaveBeenCalledWith('down_folder')

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')
        })

        it('should fetch the zip with defaults', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 2),
            }])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            await downloadChromium.withDefaults()

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')

            expect(getChromeDownloadUrlMock).toHaveBeenCalledTimes(1)

            const expected = createChromeFullConfig()

            expect(getChromeDownloadUrlMock).toHaveBeenCalledWith(expected, [{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 2),
            }])
        })

        it('should fetch the zip with defaults for single', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            await downloadChromium.withDefaults({
                single: new ComparableVersion(10, 0, 0, 0),
            })

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')
        })

        it('should fetch and exract the zip', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')
        })

        it('should start the progress with autoUnzip=false', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)
        })

        it('should start the progress with autoUnzip=true', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(spinnerMock.update).toHaveBeenCalledTimes(0)

            expect(unlinkMock).toHaveBeenCalledTimes(1)
            expect(unlinkMock).toHaveBeenCalledWith('chrome-filenameOS-x64-11.12.13.14.zip')

            expect(logger.error).toHaveBeenCalledTimes(0)
        })

        it('should update the progress', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.3,
            })

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(1)
            expect(progressMock.fraction).toHaveBeenCalledWith(0.3)
        })

        it('should extract the zip', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]
            const extractCallback = extractMock.mock.calls[0][1].onEntry

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            extractCallback({fileName: 'some-file'})
            extractCallback({fileName: 'some-file2'})

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(spinnerMock.update).toHaveBeenCalledTimes(2)
            expect(spinnerMock.update.mock.calls).toEqual([['Extracting: some-file'], ['Extracting: some-file2']])
        })

        it('should log an error on failing to remove zip file after extracting', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            unlinkMock.mockRejectedValue(new Error('unlink-error'))

            // Act
            const config = createChromeFullConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]
            const extractCallback = extractMock.mock.calls[0][1].onEntry

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            extractCallback({fileName: 'some-file'})
            extractCallback({fileName: 'some-file2'})

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(spinnerMock.update).toHaveBeenCalledTimes(2)
            expect(spinnerMock.update.mock.calls).toEqual([['Extracting: some-file'], ['Extracting: some-file2']])
            expect(logger.error).toHaveBeenCalledTimes(1)
            expect(logger.error).toHaveBeenCalledWith('Error removing zip file after extracting: Error: unlink-error')
        })

        it('should stop the spinner with error on error extracting', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedRelease: {
                    branchPosition: 123,
                    version: new ComparableVersion({
                        major: 11,
                        minor: 12,
                        branch: 13,
                        patch: 14,
                    })
                }
            }))

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            extractMock.mockImplementation(() => {
                throw new Error('extract-error')
            })

            // Act
            const config = createChromeFullConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(2)
            expect(onMock).toHaveBeenCalledWith('end', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))

            const progressCallback = progressOnMock.mock.calls[0][1]
            const extractCallback = extractMock.mock.calls[0][1].onEntry

            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            extractCallback({fileName: 'some-file'})
            extractCallback({fileName: 'some-file2'})

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(1)
            expect(progressMock.start).toHaveBeenCalledWith({
                barLength: 40,
                steps: 3,
                unit: 'MB',
                showNumeric: true,
                start: 'Downloading binary...',
                success: 'Successfully downloaded to "chrome-filenameOS-x64-11.12.13.14.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(spinnerMock.update).toHaveBeenCalledTimes(2)
            expect(spinnerMock.update.mock.calls).toEqual([['Extracting: some-file'], ['Extracting: some-file2']])

            expect(spinner.error).toHaveBeenCalledTimes(1)
            expect(spinner.error).toHaveBeenCalledWith('Error: extract-error')
        })

        it('should do nothing on --no-download', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            // Act
            const config = createChromeFullConfig({
                download: false,
            })
            await downloadChromium(config)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(0)

        })

        it('should do nothing on download and no chromeUrl', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                chromeUrl: undefined,
            }))

            // Act
            const config = createChromeFullConfig({
                download: true,
            })
            await downloadChromium(config)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(0)
        })

        it('should throw on --single without chromeUrl', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                chromeUrl: undefined,
            }))

            // Act
            const config = createChromeSingleConfig({
                single: new ComparableVersion(40, 0, 0, 1),
                download: true,
            })
            await expect(() => downloadChromium(config)).rejects.toThrow(new NoChromiumDownloadError())
        })

        it('should delete the unfinished file on SIGINT while downloading', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            processExitSpy.mockImplementation(() => undefined as never)

            statMock.mockResolvedValue({ isDirectory: () => true } as Stats)

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = progressOnMock.mock.calls[0][1]
            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })
            const signalCallback = processOnSpy.mock.calls[0][1] as () => Promise<void>
            await signalCallback()

            expect(unlinkMock).toHaveBeenCalledTimes(0)
            expect(rmdirMock).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledWith(130)
        })

        it('should delete the unfinished file on SIGINT while extracting', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            processExitSpy.mockImplementation(() => undefined as never)

            statMock.mockResolvedValue({ isDirectory: () => false, isFile: () => true } as Stats)

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = progressOnMock.mock.calls[0][1]
            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })
            const signalCallback = processOnSpy.mock.calls[0][1] as () => Promise<void>
            await signalCallback()

            expect(unlinkMock).toHaveBeenCalledTimes(1)
            expect(rmdirMock).toHaveBeenCalledTimes(0)
            expect(processExitSpy).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledWith(130)
        })

        it('should delete nothing, if no file or directory exists', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            processExitSpy.mockImplementation(() => undefined as never)

            statMock.mockResolvedValue({ isDirectory: () => false, isFile: () => false } as Stats)

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = progressOnMock.mock.calls[0][1]
            progressCallback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })
            const signalCallback = processOnSpy.mock.calls[0][1] as () => Promise<void>
            await signalCallback()

            expect(unlinkMock).toHaveBeenCalledTimes(0)
            expect(rmdirMock).toHaveBeenCalledTimes(0)
            expect(processExitSpy).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledWith(130)
        })

        it('should enable debugging on config.debug', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 1),
            }])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                debug: true,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)

            expect(loggerMock.setDebugMode).toHaveBeenCalledTimes(1)
            expect(loggerMock.setDebugMode).toHaveBeenCalledWith(DebugMode.DEBUG)
        })

        it('should silent the logger on config.quiet', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 1),
            }])

            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                quiet: true,
            })
            await downloadChromium(config)

            expect(loggerMock.silent).toHaveBeenCalledTimes(1)
            expect(loggerMock.silent).toHaveBeenCalledWith()
        })

        it('should remove the color from the logger on config.color === false', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 1),
            }])

            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                color: false,
            })
            await downloadChromium(config)

            expect(loggerMock.noColor).toHaveBeenCalledTimes(1)
            expect(loggerMock.noColor).toHaveBeenCalledWith()
        })

        it('should remove the progress bar from the logger on config.progress === false', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([{
                branchPosition: 123,
                version: new ComparableVersion(10, 0, 0, 1),
            }])

            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                progress: false,
            })
            await downloadChromium(config)

            expect(loggerMock.noProgress).toHaveBeenCalledTimes(1)
            expect(loggerMock.noProgress).toHaveBeenCalledWith()
        })

        it('should log the files and quit on config.list', async () => {
            mapApiReleasesToReleasesMock.mockReturnValue([
                {
                    branchPosition: 124,
                    version: new ComparableVersion(20, 0, 0, 1),
                },
                {
                    branchPosition: 456,
                    version: new ComparableVersion(10, 0, 0, 1)
                }
            ])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsAndIsFolderMock.mockResolvedValue(false)

            // Act
            const config = createChromeFullConfig({
                list: true
            })
            await downloadChromium(config)

            expect(loggerMock.info).toHaveBeenCalledTimes(3)
            expect(loggerMock.info.mock.calls).toEqual([['versions:'], ['20.0.0.1'], ['10.0.0.1']])
        })
    })
})
