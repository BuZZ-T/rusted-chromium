import { NoParamCallback, PathLike, Stats } from 'fs'
import { HTMLElement as NodeParserHTMLElement, Node as NodeParserNode } from 'node-html-parser'

import { ComparableVersion } from './commons/ComparableVersion'
import { DEFAULT_OPTIONS } from './config/config'
import { IConfigOptions } from './interfaces/config.interfaces'
import { IChromeConfig, IDownloadSettings, Store } from './interfaces/interfaces'

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

export const createChromeOptions = (config?: Partial<IConfigOptions>): IConfigOptions => ({
    ...DEFAULT_OPTIONS,
    ...config,
})

export const createNodeWithChildren = (...children: Array<Partial<NodeParserNode>>): NodeParserNode => ({
    childNodes: [
        ...children,
    ],
} as NodeParserNode)

export const createDownloadSettings = (settings?: Partial<IDownloadSettings>): IDownloadSettings => ({
    chromeUrl: 'chromeUrl',
    selectedVersion: 'selectedVersion',
    filenameOS: 'filenameOS',
    ...settings,
})

/**
 * (Re-) defines one overload method of fs.mkdir. Used to nail down this overloading to jest's mockImplementation
 */
export type MkdirWithOptions = (path: PathLike, options: unknown, callback: NoParamCallback) => void

export type ReadFileWithOptions = (path: PathLike, options: unknown, callback: (err: NodeJS.ErrnoException | null, data: string) => void) => void

export type StatsWithoutOptions = (path: PathLike, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void) => void

export const createNodeParserHTMLElement = (querySelectorAllMock: jest.Mock<any, any>): NodeParserHTMLElement & { valid: boolean } => {
    const element = new NodeParserHTMLElement('html', {}) as NodeParserHTMLElement & { valid: boolean }
    element.valid = true
    element.querySelectorAll = querySelectorAllMock

    return element
}
