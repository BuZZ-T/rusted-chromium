/**
 * Tests download file
 * 
 * @group unit/file/download
 */

import { existsSync, mkdir, createWriteStream, stat, rmdir, unlink, Stats } from 'fs'
import { Response as NodeFetchResponse } from 'node-fetch'
import type { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'
/* eslint-disable-next-line import/no-namespace */
import * as unzipper from 'unzipper'

import { fetchChromeZipFile } from './api'
import { ComparableVersion } from './commons/ComparableVersion'
import { MappedVersion } from './commons/MappedVersion'
import { downloadChromium } from './download'
import { NoChromiumDownloadError } from './errors'
import { progress } from './log/progress'
import { logger } from './log/spinner'
import { loadStore } from './store/loadStore'
import { Store } from './store/Store'
import { createChromeFullConfig, createStore, createGetChromeDownloadUrlReturn, MkdirWithOptions, StatsWithoutOptions, createChromeSingleConfig } from './test/test.utils'
import { getChromeDownloadUrl, loadVersions, mapVersions } from './versions'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const Progress = require('node-fetch-progress')

const onMock = jest.fn()

jest.mock('fs')
jest.mock('node-fetch-progress', () => jest.fn(() => ({
    on: onMock,
})))
jest.mock('unzipper')

jest.mock('./api')
jest.mock('./log/progress')
jest.mock('./log/spinner')
jest.mock('./log/printer')
jest.mock('./store/loadStore')
jest.mock('./versions')

describe('download', () => {
    describe('downloadChromium', () => {

        let loadVersionsMock: MaybeMocked<typeof loadVersions>
        let loadStoreMock: MaybeMocked<typeof loadStore>
        let mapVersionsMock: MaybeMocked<typeof mapVersions>
        let getChromeDownloadUrlMock: MaybeMocked<typeof getChromeDownloadUrl>

        let fetchChromeZipFileMock: MaybeMocked<typeof fetchChromeZipFile>

        let progressConstructorMock: MaybeMocked<typeof Progress>
        let progressMock: MaybeMockedDeep<typeof progress>
        let loggerMock: MaybeMockedDeep<typeof logger>

        let unzipperMock: MaybeMockedDeep<typeof unzipper>

        let existsSyncMock: MaybeMocked<typeof existsSync>
        let createWriteStreamMock: MaybeMockedDeep<typeof createWriteStream>
        let mkdirMock: MaybeMocked<MkdirWithOptions>
        let statMock: MaybeMocked<StatsWithoutOptions>
        let rmdirMock: MaybeMocked<typeof rmdir>
        let unlinkMock: MaybeMocked<typeof unlink>

        let pipeMock: jest.Mock
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

            unzipperMock = mocked(unzipper, true)

            existsSyncMock = mocked(existsSync)
            createWriteStreamMock = mocked(createWriteStream)
            mkdirMock = mocked(mkdir as MkdirWithOptions)
            statMock = mocked(stat as StatsWithoutOptions)
            rmdirMock = mocked(rmdir)
            unlinkMock = mocked(unlink)

            pipeMock = jest.fn()
            zipFileResource = {
                body: {
                    pipe: pipeMock,
                } as unknown as NodeJS.ReadableStream
            } as NodeFetchResponse
            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            processOnSpy = jest.spyOn(process, 'on')
            processExitSpy = jest.spyOn(process, 'exit')
        })

        beforeEach(() => {
            loadVersionsMock.mockClear()
            loadStoreMock.mockClear()
            loadStoreMock.mockResolvedValue(new Store(createStore()))

            mapVersionsMock.mockClear()
            getChromeDownloadUrlMock.mockClear()
            fetchChromeZipFileMock.mockClear()

            progressConstructorMock.mockClear()

            progressMock.start.mockClear()
            progressMock.fraction.mockClear()
            loggerMock.info.mockClear()

            unzipperMock.Extract.mockClear()

            existsSyncMock.mockClear()
            createWriteStreamMock.mockClear()
            mkdirMock.mockClear()
            statMock.mockClear()
            rmdirMock.mockClear()
            unlinkMock.mockClear()

            pipeMock.mockClear()
            onMock.mockClear()

            processOnSpy.mockClear()
            processExitSpy.mockClear()
        })

        it('should fetch the zip and create the dest folder', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createGetChromeDownloadUrlReturn())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

            mkdirMock.mockImplementation((path, options, callback) => {
                callback(null)
            })

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

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const progressCallback = onMock.mock.calls[0][1]

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

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const progressCallback = onMock.mock.calls[0][1]

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
                success: 'Successfully downloaded and extracted to "chrome-filenameOS-x64-11.12.13.14"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)
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
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const progressCallback = onMock.mock.calls[0][1]

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
                success: 'Successfully downloaded and extracted to "chrome-filenameOS-x64-11.12.13.14"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(1)
            expect(progressMock.fraction).toHaveBeenCalledWith(0.3)
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

            statMock.mockImplementation((path, callback) => {
                callback(null, { isDirectory: () => true } as Stats)
            })
            rmdirMock.mockImplementation((path, options, callback) => {
                callback(null)
            })
            unlinkMock.mockImplementation((path, callback) => {
                callback(null)
            })

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = onMock.mock.calls[0][1]
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

            statMock.mockImplementation((path, callback) => {
                callback(null, { isDirectory: () => false, isFile: () => true } as Stats)
            })
            rmdirMock.mockImplementation((path, options, callback) => {
                callback(null)
            })
            unlinkMock.mockImplementation((path, callback) => {
                callback(null)
            })

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = onMock.mock.calls[0][1]
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

            statMock.mockImplementation((path, callback) => {
                callback(null, { isDirectory: () => false, isFile: () => false } as Stats)
            })
            rmdirMock.mockImplementation((path, options, callback) => {
                callback(null)
            })
            unlinkMock.mockImplementation((path, callback) => {
                callback(null)
            })

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeFullConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            const progressCallback = onMock.mock.calls[0][1]
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
    })
})
