/**
 * Tests rusted file
 *
 * @group unit/file/rusted
 */

import type { Logger, ProgressBar, Spinner } from 'yalpt'
import { logger, progress, spinner } from 'yalpt'

import { readConfig } from './config/config'
import { downloadChromium } from './download/download'
import { rusted } from './rusted'
import { createChromeFullConfig } from './test/test.utils'

jest.mock('./download/download')
jest.mock('./config/config')
jest.mock('yalpt')

describe('rusted', () => {
    let readConfigMock: jest.MaybeMocked<typeof readConfig>
    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>

    let loggerMock: jest.MaybeMockedDeep<Logger>
    let spinnerMock: jest.MaybeMockedDeep<Spinner>
    let progressMock: jest.MaybeMockedDeep<ProgressBar>

    beforeAll(() => {
        readConfigMock = jest.mocked(readConfig)
        downloadChromiumMock = jest.mocked(downloadChromium)

        loggerMock = jest.mocked(logger)
        spinnerMock = jest.mocked(spinner)
        progressMock = jest.mocked(progress)
    })

    beforeEach(() => {
        readConfigMock.mockClear()
        downloadChromiumMock.mockClear()

        loggerMock.error.mockClear()
    })

    it('should download chromium with the given config', async () => {

        const config = createChromeFullConfig()

        readConfigMock.mockReturnValue(config)

        process.argv.push('test-param')

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith(config)

        expect(loggerMock.error).toHaveBeenCalledTimes(0)

        expect(loggerMock.silent).toHaveBeenCalledTimes(0)
        expect(spinnerMock.silent).toHaveBeenCalledTimes(0)
        expect(progressMock.silent).toHaveBeenCalledTimes(0)

        expect(loggerMock.noColor).toHaveBeenCalledTimes(0)
        expect(spinnerMock.noColor).toHaveBeenCalledTimes(0)
        expect(progressMock.noColor).toHaveBeenCalledTimes(0)
    })
})
