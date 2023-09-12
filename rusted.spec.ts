/**
 * Tests rusted file
 * 
 * @group unit/file/rusted
 */

import { readConfig } from './config/config'
import { downloadChromium } from './download/download'
import type { ConfigWrapper } from './interfaces/interfaces'
import { logger, Logger } from './log/logger'
import { progress, ProgressBar } from './log/progress'
import { spinner, Spinner } from './log/spinner'
import { rusted } from './rusted'
import { exportStore } from './store/exportStore'
import { importAndMergeLocalstore } from './store/importStore'
import { createChromeFullConfig, createExportConfig, createImportConfig } from './test/test.utils'

jest.mock('./download/download')
jest.mock('./config/config')
jest.mock('./log/logger')
jest.mock('./log/spinner')
jest.mock('./log/progress')
jest.mock('./store/importStore')
jest.mock('./store/exportStore')

describe('rusted', () => {
    let readConfigMock: jest.MaybeMocked<typeof readConfig>
    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>
    let importAndMergeLocalstoreMock: jest.MaybeMocked<typeof importAndMergeLocalstore>
    let exportStoreMock: jest.MaybeMocked<typeof exportStore>

    let loggerMock: jest.MaybeMockedDeep<Logger>
    let spinnerMock: jest.MaybeMockedDeep<Spinner>
    let progressMock: jest.MaybeMockedDeep<ProgressBar>

    beforeAll(() => {
        readConfigMock = jest.mocked(readConfig)
        downloadChromiumMock = jest.mocked(downloadChromium)
        importAndMergeLocalstoreMock = jest.mocked(importAndMergeLocalstore)
        exportStoreMock = jest.mocked(exportStore)

        loggerMock = jest.mocked(logger)
        spinnerMock = jest.mocked(spinner)
        progressMock = jest.mocked(progress)
    })

    beforeEach(() => {
        readConfigMock.mockClear()
        downloadChromiumMock.mockClear()
        importAndMergeLocalstoreMock.mockClear()
        exportStoreMock.mockClear()

        loggerMock.error.mockClear()
    })

    it('should download chromium with the given config', async () => {

        const config = createChromeFullConfig()

        const configWrapper: ConfigWrapper = {
            action: 'loadChrome',
            config,
        }
        readConfigMock.mockReturnValue(configWrapper)

        process.argv.push('test-param')

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith(config)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(0)

        expect(exportStoreMock).toHaveBeenCalledTimes(0)

        expect(loggerMock.error).toHaveBeenCalledTimes(0)

        expect(loggerMock.silent).toHaveBeenCalledTimes(0)
        expect(spinnerMock.silent).toHaveBeenCalledTimes(0)
        expect(progressMock.silent).toHaveBeenCalledTimes(0)
    })

    it('should import and merge the localstore', async () => {
        const configWrapper: ConfigWrapper = {
            action: 'importStore',
            config: createImportConfig()
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(0)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(1)
        expect(importAndMergeLocalstoreMock).toHaveBeenCalledWith(configWrapper.config)

        expect(exportStoreMock).toHaveBeenCalledTimes(0)

        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should export the localstore', async () => {
        const configWrapper: ConfigWrapper = {
            action: 'exportStore',
            config: createExportConfig(),
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(0)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(0)

        expect(exportStoreMock).toHaveBeenCalledTimes(1)
        expect(exportStoreMock).toHaveBeenCalledWith(configWrapper.config, process.stdout)

        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should log an error on unknown config action', async () => {
        const configWrapper: ConfigWrapper = {
            action: 'something' as 'importStore',
            config: createImportConfig({ url: 'something' }),
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(0)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(0)

        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(loggerMock.error).toHaveBeenCalledWith('Failed to read config: {"action":"something","config":{"url":"something","quiet":false,"debug":false}}')
    })

    it('should set the logger to silent on config.quiet', async () => {
        const configWrapper: ConfigWrapper = {
            action: 'loadChrome',
            config: createChromeFullConfig({
                quiet: true,
            }),
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(loggerMock.silent).toHaveBeenCalledTimes(1)
        expect(loggerMock.silent).toHaveBeenCalledWith()
        expect(spinnerMock.silent).toHaveBeenCalledTimes(1)
        expect(spinnerMock.silent).toHaveBeenCalledWith()
        expect(progressMock.silent).toHaveBeenCalledTimes(1)
        expect(progressMock.silent).toHaveBeenCalledWith()
    })
})
