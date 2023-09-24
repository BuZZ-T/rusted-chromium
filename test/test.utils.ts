import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG, DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import { MappedVersion } from '../commons/MappedVersion'
import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { GetChromeDownloadUrlReturn } from '../interfaces/function.interfaces'
import type { IChromeFullConfig, IExportConfig, IStoreConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { PrinterWriteStream } from '../interfaces/printer.interfaces'
import type { IListStore } from '../interfaces/store.interfaces'
import { ApiRelease } from '../releases/release.types'

export const createChromeFullConfig = (config?: Partial<IChromeFullConfig>): IChromeFullConfig => ({
    ...DEFAULT_FULL_CONFIG,
    ...config,
})

export const createChromeSingleConfig = (config?: Partial<IChromeSingleConfig>): IChromeSingleConfig => ({
    ...DEFAULT_SINGLE_CONFIG,
    ...config,
})

export const createImportConfig = (config?: Partial<IStoreConfig>): IStoreConfig => ({
    debug: false,
    color: true,
    progress: true,
    quiet: false,
    url: 'some-url',
    ...config,
})

export const createExportConfig = (config?: Partial<IExportConfig>): IExportConfig => ({
    debug: false,
    color: true,
    progress: true,
    quiet: false,
    ...config,
})

export const createStore = (store?: Partial<IListStore>): IListStore => ({
    win: {
        x64: [],
        x86: [],
    },
    linux: {
        x64: [],
        x86: [],
    },
    mac: {
        x64: [],
        arm: [],
    },
    ...store,
})

export const createChromeOptions = (config?: Partial<IConfigOptions>): IConfigOptions => ({
    ...DEFAULT_CONFIG_OPTIONS,
    ...config,
})

export const createGetChromeDownloadUrlReturn = (settings?: Partial<GetChromeDownloadUrlReturn>): GetChromeDownloadUrlReturn => ({
    chromeUrl: 'chromeUrl',
    selectedRelease: {
        version: new MappedVersion(10, 0, 0, 0, false),
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

// export const createRelease = (release?: Partial<Release>): Release => ({
//     version: new MappedVersion(10, 0, 0, 0, false),
//     branchPosition: 0,
//     ...release,
// })

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
