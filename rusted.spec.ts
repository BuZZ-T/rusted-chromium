import { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { readConfig } from './config/config'
import { downloadChromium } from './download'
import { ConfigWrapper } from './interfaces/interfaces'
import { logger } from './log/spinner'
import { rusted } from './rusted'
import { exportStore } from './store/exportStore'
import { importAndMergeLocalstore } from './store/importStore'
import { createChromeConfig, createExportConfig, createImportConfig } from './test.utils'

jest.mock('./download')
jest.mock('./config/config')
jest.mock('./log/spinner')
jest.mock('./store/importStore')
jest.mock('./store/exportStore')

describe('rusted', () => {
    let readConfigMock: MaybeMocked<typeof readConfig>
    let downloadChromiumMock: MaybeMocked<typeof downloadChromium>
    let importAndMergeLocalstoreMock: MaybeMocked<typeof importAndMergeLocalstore>
    let exportStoreMock: MaybeMocked<typeof exportStore>
    let loggerMock: MaybeMockedDeep<typeof logger>

    beforeAll(() => {
        readConfigMock = mocked(readConfig)
        downloadChromiumMock = mocked(downloadChromium)
        importAndMergeLocalstoreMock = mocked(importAndMergeLocalstore)
        exportStoreMock = mocked(exportStore)
        loggerMock = mocked(logger, true)
    })

    beforeEach(() => {
        readConfigMock.mockClear()
        downloadChromiumMock.mockClear()
        importAndMergeLocalstoreMock.mockClear()
        exportStoreMock.mockClear()

        loggerMock.error.mockClear()
    })

    it('should download chromium with the given config', async () => {

        const config = createChromeConfig()

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
        expect(exportStoreMock).toHaveBeenCalledWith(configWrapper.config)

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
        expect(loggerMock.error).toHaveBeenCalledWith('Failed to read config: {"action":"something","config":{"url":"something","quiet":false}}')
    })
})
