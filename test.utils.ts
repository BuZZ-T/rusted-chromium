import { IChromeConfig, IComparableVersion, Store } from './interfaces'

export const createIComparableVersion = (major: number, minor: number, branch: number, patch: number): IComparableVersion => ({
    major,
    minor,
    branch,
    patch,
})

const DEFAULT_CONFIG: IChromeConfig = {
    arch: "x64",
    autoUnzip: false,
    download: false,
    downloadFolder: null,
    downloadUrl: null,
    hideNegativeHits: false,
    interactive: false,
    max: createIComparableVersion(Infinity, 0, 0, 0),
    min: createIComparableVersion(0, 0, 0, 0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: "linux",
    results: Infinity,
    store: false,
}

const EMPTY_STORE: Store = {
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
}

export const createChromeConfig = (config?: Partial<IChromeConfig>) => ({
    ...DEFAULT_CONFIG,
    ...config,
})

export const createStore = (store?: Partial<Store>) => ({
    ...EMPTY_STORE,
    ...store,
})

export const PROMISIFY_NO_ERROR = false
export type PromisifyCallback = (p: boolean, ...args: any[]) => void
