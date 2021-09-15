import { MaybeMocked, MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { readConfig } from './config/config'
import { downloadChromium } from './download'
import { ConfigWrapper, IStoreConfig } from './interfaces'
import { logger } from './log/spinner'
import { rusted } from './rusted'
import { importAndMergeLocalstore } from './store/importStore'
import { createChromeConfig } from './test.utils'

jest.mock('./download')
jest.mock('./config/config')
jest.mock('./log/spinner')
jest.mock('./store/importStore')

describe('rusted', () => {
    let readConfigMock: MaybeMocked<typeof readConfig>
    let downloadChromiumMock: MaybeMocked<typeof downloadChromium>
    let importAndMergeLocalstoreMock: MaybeMocked<typeof importAndMergeLocalstore>
    let loggerMock: MaybeMockedDeep<typeof logger>

    beforeAll(() => {
        readConfigMock = mocked(readConfig)
        downloadChromiumMock = mocked(downloadChromium)
        importAndMergeLocalstoreMock = mocked(importAndMergeLocalstore)
        loggerMock = mocked(logger, true)
    })

    beforeEach(() => {
        readConfigMock.mockClear()
        downloadChromiumMock.mockClear()
        importAndMergeLocalstoreMock.mockClear()

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

        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should import and merge the localstore', async () => {
        const config: IStoreConfig = {
            url: 'import-url'
        }

        const configWrapper: ConfigWrapper = {
            action: 'importStore',
            config,
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(0)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(1)
        expect(importAndMergeLocalstoreMock).toHaveBeenCalledWith(config)

        expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('should log an error on unknown config action', async () => {
        const configWrapper: ConfigWrapper = {
            action: 'something' as 'importStore',
            config: { url: 'something' }
        }
        readConfigMock.mockReturnValue(configWrapper)

        await rusted(['test-param'], 'linux')

        expect(readConfigMock).toHaveBeenCalledTimes(1)
        expect(readConfigMock).toHaveBeenCalledWith(['test-param'], 'linux')

        expect(downloadChromiumMock).toHaveBeenCalledTimes(0)

        expect(importAndMergeLocalstoreMock).toHaveBeenCalledTimes(0)

        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(loggerMock.error).toHaveBeenCalledWith('Failed to read config: {"action":"something","config":{"url":"something"}}')
    })
})
