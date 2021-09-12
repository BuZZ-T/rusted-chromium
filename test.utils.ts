import { ComparableVersion } from './commons/ComparableVersion'
import { DEFAULT_OPTIONS } from './config/config'
import { IConfigOptions } from './config/config.interfaces'
import { IChromeConfig, IDownloadSettings, Store } from './interfaces'

export interface PartialStdio {
    write: () => boolean
    clearLine: () => boolean
    cursorTo: () => boolean
    moveCursor: () => boolean
}

export const createChromeConfig = (config?: Partial<IChromeConfig>): IChromeConfig => ({
    arch: 'x64',
    autoUnzip: false,
    download: true,
    downloadFolder: null,
    hideNegativeHits: false,
    interactive: true,
    max: new ComparableVersion(10000, 0, 0, 0),
    min: new ComparableVersion(0, 0, 0, 0),
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
export type PromisifyErrorCallback = (p: Error, ...args: any[]) => void

export const createChromeOptions = (config?: Partial<IConfigOptions>): IConfigOptions => ({
    ...DEFAULT_OPTIONS,
    ...config,
})

export const createChildNodeWithChildren = (...children: Array<Partial<ChildNode>>): ChildNode => ({
    childNodes: [
        ...children,
    ] as unknown as NodeListOf<ChildNode>
} as ChildNode)

export const createDownloadSettings = (settings?: Partial<IDownloadSettings>): IDownloadSettings => ({
    chromeUrl: 'chromeUrl',
    selectedVersion: 'selectedVersion',
    filenameOS: 'filenameOS',
    ...settings,
})