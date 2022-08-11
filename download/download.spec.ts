/**
 * Tests download file
 * 
 * @group unit/file/download
 */

import { existsSync, createWriteStream, Stats } from 'fs'
import { mkdir, stat, rmdir, unlink }from 'fs/promises'
import { Response as NodeFetchResponse } from 'node-fetch'
import type { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { fetchChromeZipFile } from '../api'
import { ComparableVersion } from '../commons/ComparableVersion'
import { MappedVersion } from '../commons/MappedVersion'
import { NoChromiumDownloadError } from '../errors'
import { IChromeConfig } from '../interfaces/interfaces'
import { Logger, logger, DebugMode } from '../log/logger'
import { progress, ProgressBar } from '../log/progress'
import { spinner, Spinner } from '../log/spinner'
import { loadStore } from '../store/loadStore'
import { Store } from '../store/Store'
import { createChromeFullConfig, createStore, createGetChromeDownloadUrlReturn, createChromeSingleConfig } from '../test/test.utils'
import { getChromeDownloadUrl, loadVersions, mapVersions } from '../versions'
import { downloadChromium } from './download'

/* eslint-disable @typescript-eslint/no-var-requires */
const extract = require('extract-zip')
const Progress = require('node-fetch-progress')
/* eslint-enable @typescript-eslint/no-var-requires */

const progressOnMock = jest.fn()

jest.mock('fs')
jest.mock('fs/promises')
jest.mock('node-fetch-progress')
jest.mock('extract-zip')

jest.mock('../api')
jest.mock('../log/progress')
jest.mock('../log/spinner')
jest.mock('../log/logger')
jest.mock('../log/printer')
jest.mock('../store/loadStore')
jest.mock('../versions')

describe('download', () => {
    describe('downloadChromium', () => {

        let loadVersionsMock: MaybeMocked<typeof loadVersions>
        let loadStoreMock: MaybeMocked<typeof loadStore>
        let mapVersionsMock: MaybeMocked<typeof mapVersions>
        let getChromeDownloadUrlMock: MaybeMocked<typeof getChromeDownloadUrl>

        let fetchChromeZipFileMock: MaybeMocked<typeof fetchChromeZipFile>

        let progressConstructorMock: MaybeMocked<typeof Progress>
        let progressMock: MaybeMockedDeep<ProgressBar>
        let loggerMock: MaybeMockedDeep<Logger>
        let spinnerMock: MaybeMockedDeep<Spinner>

        let extractMock: MaybeMockedDeep<typeof extract>

        let existsSyncMock: MaybeMocked<typeof existsSync>
        let createWriteStreamMock: MaybeMockedDeep<typeof createWriteStream>
        let mkdirMock: MaybeMocked<typeof mkdir>
        let statMock: MaybeMocked<typeof stat>
        let rmdirMock: MaybeMocked<typeof rmdir>
        let unlinkMock: MaybeMocked<typeof unlink>

        let pipeMock: jest.Mock
        let onMock: jest.Mock
        let zipFileResource: NodeFetchResponse

        let processOnSpy: jest.SpyInstance
        let processExitSpy: jest.SpyInstance

        beforeAll(() => {
            loadVersionsMock = mocked(loadVersions)
            loadStoreMock = mocked(loadStore)
            mapVersionsMock = mocked(mapVersions)
            getChromeDownloadUrlMock = mocked(getChromeDownloadUrl)
            fetchChromeZipFileMock = mocked(fetchChromeZipFile)

            progressConstructorMock = mocked(Progress)
            progressMock = mocked(progress, true)
            loggerMock = mocked(logger, true)
            spinnerMock = mocked(spinner, true)

            extractMock = mocked(extract)

            existsSyncMock = mocked(existsSync)
            createWriteStreamMock = mocked(createWriteStream)
            mkdirMock = mocked(mkdir)
            statMock = mocked(stat)
            rmdirMock = mocked(rmdir)
            unlinkMock = mocked(unlink)

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
        })

        beforeEach(() => {
            loadVersionsMock.mockReset()
            loadVersionsMock.mockResolvedValue(['10.0.0.0', '11.0.0.0', '12.0.0.0', '13.0.0.0', '14.0.0.0', '15.0.0.0'])
            
            loadStoreMock.mockReset()
            loadStoreMock.mockResolvedValue(new Store(createStore()))

            mapVersionsMock.mockReset()
            mapVersionsMock.mockReturnValue([new MappedVersion('10.0.0.0', true), new MappedVersion('11.0.0.0', true)])

            getChromeDownloadUrlMock.mockReset()
            fetchChromeZipFileMock.mockReset()
            
            progressMock.start.mockReset()
            progressMock.fraction.mockReset()

            loggerMock.info.mockReset()
            loggerMock.setDebugMode.mockReset()
            
            spinnerMock.start.mockReset()
            spinnerMock.success.mockReset()
            spinnerMock.error.mockReset()
            spinnerMock.update.mockReset()
            
            extractMock.mockReset()
            
            existsSyncMock.mockReset()
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
            mapVersionsMock.mockReturnValue([new MappedVersion(10, 0, 0, 1, false)])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)
            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(existsSyncMock).toHaveBeenCalledWith('down_folder')
            expect(mkdirMock).toHaveBeenCalledTimes(1)
    
            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })
    
            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)
    
            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')

            expect(getChromeDownloadUrlMock).toHaveBeenCalledTimes(1)

            const expected: IChromeConfig = {
                arch: 'x64',
                autoUnzip: false,
                debug: false,
                download: true,
                downloadFolder: 'down_folder',
                hideNegativeHits: false,
                interactive: true,
                inverse: false,
                max: new ComparableVersion({
                    major: 10000,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                }),
                min: new ComparableVersion({
                    branch: 0,
                    major: 0,
                    minor: 0,
                    patch: 0,
                }),
                onFail: 'nothing',
                onlyNewestMajor: false,
                os: 'linux',
                quiet: false,
                results: 10,
                single: null,
                store: true,
                list: false,
            }
            
            expect(getChromeDownloadUrlMock).toHaveBeenCalledWith(expected, [new MappedVersion(10, 0, 0, 1, false)])
        })

        it('should fetch the zip and create the dest folder on finish', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })
            await downloadChromium(config)
            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(existsSyncMock).toHaveBeenCalledWith('down_folder')
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

            existsSyncMock.mockReturnValue(true)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
                downloadFolder: 'down_folder',
            })

            await downloadChromium(config)

            expect(mkdirMock).toHaveBeenCalledTimes(0)

            expect(existsSyncMock).toHaveBeenCalledTimes(1)
            expect(existsSyncMock).toHaveBeenCalledWith('down_folder')

            expect(progressConstructorMock).toHaveBeenCalledTimes(1)
            expect(progressConstructorMock).toHaveBeenCalledWith(zipFileResource, { throttle: 100 })

            expect(progressMock.start).toHaveBeenCalledTimes(0)
            expect(progressMock.fraction).toHaveBeenCalledTimes(0)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(1)
            expect(fetchChromeZipFileMock).toHaveBeenCalledWith('chromeUrl')
        })

        it('should fetch the zip with defaults', async () => {
            mapVersionsMock.mockReturnValue([new MappedVersion(10, 0, 0, 2, false)])
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

            const expected: IChromeConfig = {
                arch: 'x64',
                autoUnzip: false,
                debug: false,
                download: true,
                downloadFolder: null,
                hideNegativeHits: false,
                interactive: true,
                inverse: false,
                max: new ComparableVersion({
                    major: 10000,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                }),
                min: new ComparableVersion({
                    branch: 0,
                    major: 0,
                    minor: 0,
                    patch: 0,
                }),
                onFail: 'nothing',
                onlyNewestMajor: false,
                os: 'linux',
                quiet: false,
                results: 10,
                single: null,
                store: true,
                list: false,
            }

            expect(getChromeDownloadUrlMock).toHaveBeenCalledWith(expected, [new MappedVersion(10, 0, 0, 2, false)])
            
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
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
            // download.ts:70

            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn({
                selectedVersion: new MappedVersion({
                    major: 11,
                    minor: 12,
                    branch: 13,
                    patch: 14,
                    disabled: false,
                })
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
            mapVersionsMock.mockReturnValue([new MappedVersion(10, 0, 0, 1, false)])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

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
        
        it('should log the files and quit on config.list', async () => {
            mapVersionsMock.mockReturnValue([new MappedVersion(20, 0, 0, 1, true), new MappedVersion(10, 0, 0, 1, false)])
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

            // Act
            const config = createChromeFullConfig({
                list: true
            })
            await downloadChromium(config)

            expect(loggerMock.info).toHaveBeenCalledTimes(2)
            expect(loggerMock.warn).toHaveBeenCalledTimes(1)
            expect(loggerMock.info.mock.calls).toEqual([['versions:'], ['10.0.0.1']])
            expect(loggerMock.warn).toHaveBeenCalledWith('20.0.0.1')
        })
    })
})
