import { IConfigOptions } from './config/config.interfaces'
import { IChromeConfig, IComparableVersion, Store } from './interfaces'
import { DEFAULT_OPTIONS } from './config/config'

export const createIComparableVersion = (major: number, minor: number, branch: number, patch: number): IComparableVersion => ({
    major,
    minor,
    branch,
    patch,
})

export const createChromeConfig = (config?: Partial<IChromeConfig>): IChromeConfig => ({
    arch: 'x64',
    autoUnzip: false,
    download: true,
    downloadFolder: null,
    hideNegativeHits: false,
    interactive: true,
    max: createIComparableVersion(10000, 0, 0, 0),
    min: createIComparableVersion(0, 0, 0, 0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    results: 10,
    store: true,
    single: null,
    inverse: false,
    ...config,
})

export const createStore = (store?: Partial<Store>): Store => ({
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
        x86: [],
    },
    ...store,
})

export const PROMISIFY_NO_ERROR = false
export type PromisifyCallback = (p: boolean, ...args: any[]) => void

export const createChromeOptions = (config?: Partial<IConfigOptions>): IConfigOptions => ({
    ...DEFAULT_OPTIONS,
    ...config,
})
