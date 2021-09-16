import { createWriteStream, existsSync, mkdir } from 'fs'
import { Response as NodeFetchResponse } from 'node-fetch'
import { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'
import * as unzipper from 'unzipper'

import { fetchChromeZipFile } from './api'
import { downloadChromium } from './download'
import { NoChromiumDownloadError } from './errors'
import { progress } from './log/progress'
import { logger } from './log/spinner'
import { loadStore } from './store/store'
import { createChromeConfig, createStore, createDownloadSettings, MkdirWithOptions } from './test.utils'
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
jest.mock('./store/store')
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

        let pipeMock: jest.Mock
        let zipFileResource: NodeFetchResponse

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

            pipeMock = jest.fn()
            zipFileResource = {
                body: {
                    pipe: pipeMock,
                } as unknown as NodeJS.ReadableStream
            } as NodeFetchResponse
            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
        })

        beforeEach(() => {
            loadVersionsMock.mockClear()
            loadStoreMock.mockClear()
            loadStoreMock.mockResolvedValue(createStore())

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

            pipeMock.mockClear()
            onMock.mockClear()
        })

        it('should fetch the zip and create the dest folder', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)
            existsSyncMock.mockReturnValue(false)

            mkdirMock.mockImplementation((path, options, callback) => {
                callback(null)
            })

            // Act
            const config = createChromeConfig({
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
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            existsSyncMock.mockReturnValue(true)

            // Act
            const config = createChromeConfig({
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
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeConfig({
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
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeConfig({
                autoUnzip: false,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const callback = onMock.mock.calls[0][1]

            callback({
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
                success: 'Successfully downloaded to "chrome-filenameOS-x64-selectedVersion.zip"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)
        })

        it('should start the progress with autoUnzip=true', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const callback = onMock.mock.calls[0][1]

            callback({
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
                success: 'Successfully downloaded and extracted to "chrome-filenameOS-x64-selectedVersion"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(0)
        })

        it('should update the progress', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            fetchChromeZipFileMock.mockResolvedValue(zipFileResource)

            // Act
            const config = createChromeConfig({
                autoUnzip: true,
            })
            await downloadChromium(config)

            expect(onMock).toHaveBeenCalledTimes(1)
            expect(onMock).toHaveBeenCalledWith('progress', expect.any(Function))

            const callback = onMock.mock.calls[0][1]

            callback({
                total: 3 * 1024 * 1024,
                progress: 0.1,
            })

            callback({
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
                success: 'Successfully downloaded and extracted to "chrome-filenameOS-x64-selectedVersion"',
                fail: 'Failed to download binary'
            })

            expect(progressMock.fraction).toHaveBeenCalledTimes(1)
            expect(progressMock.fraction).toHaveBeenCalledWith(0.3)
        })

        it('should do nothing on --no-download', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings())

            // Act
            const config = createChromeConfig({
                download: false,
            })
            await downloadChromium(config)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(0)

        })

        it('should do nothing on download and no chromeUrl', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings({
                chromeUrl: undefined,
            }))

            // Act
            const config = createChromeConfig({
                download: true,
            })
            await downloadChromium(config)

            expect(fetchChromeZipFileMock).toHaveBeenCalledTimes(0)
        })

        it('should throw on --single without chromeUrl', async () => {
            getChromeDownloadUrlMock.mockResolvedValue(createDownloadSettings({
                chromeUrl: undefined,
            }))

            // Act
            const config = createChromeConfig({
                single: '40.0.0.1',
                download: true,
            })
            await expect(() => downloadChromium(config)).rejects.toThrow(new NoChromiumDownloadError())
        })
    })
})
