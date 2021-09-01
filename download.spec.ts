import * as fs from 'fs'
import { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'
import * as unzipper from 'unzipper'

import { fetchChromeZipFile } from './api'
import { progress } from './log/progress'
import { logger } from './log/spinner'
import { loadStore } from './store/store'
import { getChromeDownloadUrl, loadVersions, mapVersions } from './versions'
import { downloadChromium } from './download'
import { createChromeConfig, createStore } from './test.utils';

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

        let fsMock: MaybeMockedDeep<typeof fs>

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

            fsMock = mocked(fs, true)
        })

        beforeEach(() => {
            loadVersionsMock.mockClear()
            loadStoreMock.mockClear()
            mapVersionsMock.mockClear()
            getChromeDownloadUrlMock.mockClear()
            fetchChromeZipFileMock.mockClear()

            progressConstructorMock.mockClear()

            progressMock.start.mockClear()
            progressMock.fraction.mockClear()
            loggerMock.info.mockClear()

            unzipperMock.Extract.mockClear()

            fsMock.existsSync.mockClear()
            fsMock.createWriteStream.mockClear()
            fsMock.mkdir.mockClear()
        })

        it('should', async () => {
            loadStoreMock.mockResolvedValue(createStore())
            
            const config = createChromeConfig()
            await downloadChromium(config)
        })
    })
})
