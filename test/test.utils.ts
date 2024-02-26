import { ComparableVersion } from '../commons/ComparableVersion'
import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG, DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { GetChromeDownloadUrlReturn } from '../interfaces/function.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { ApiRelease } from '../releases/release.types'

export const createChromeFullConfig = (config?: Partial<IChromeFullConfig>): IChromeFullConfig => ({
    ...DEFAULT_FULL_CONFIG,
    ...config,
})

export const createChromeSingleConfig = (config?: Partial<IChromeSingleConfig>): IChromeSingleConfig => ({
    ...DEFAULT_SINGLE_CONFIG,
    ...config,
})

export const createChromeOptions = (config?: Partial<IConfigOptions>): IConfigOptions => ({
    ...DEFAULT_CONFIG_OPTIONS,
    ...config,
})

export const createGetChromeDownloadUrlReturn = (settings?: Partial<GetChromeDownloadUrlReturn>): GetChromeDownloadUrlReturn => ({
    chromeUrl: 'chromeUrl',
    selectedRelease: {
        version: new ComparableVersion(10, 0, 0, 0),
        branchPosition: 0,
    },
    filenameOS: 'filenameOS',
    report: [],
    ...settings,
})

export const createStdioMock = (): jest.MaybeMockedDeep<PrinterWriteStream> => ({
    write: jest.fn(),
    clearLine: jest.fn(),
    cursorTo: jest.fn(),
    moveCursor: jest.fn(),
})

export const createApiRelease = (release?: Partial<ApiRelease>): ApiRelease => ({
    channel: 'Beta',
    chromium_main_branch_position: 0,
    hashes: {},
    milestone: 0,
    platform: 'Android',
    previous_version: '',
    time: 0,
    version: '',
    ...release,
})
