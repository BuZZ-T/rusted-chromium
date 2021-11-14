import { NoParamCallback, PathLike, Stats } from 'fs'
import { HTMLElement as NodeParserHTMLElement, Node as NodeParserNode } from 'node-html-parser'

import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG, DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import { MappedVersion } from '../commons/MappedVersion'
import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { GetChromeDownloadUrlReturn } from '../interfaces/function.interfaces'
import type { IChromeFullConfig, IExportConfig, IStoreConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import type { IListStore } from '../interfaces/store.interfaces'

export const createChromeFullConfig = (config?: Partial<IChromeFullConfig>): IChromeFullConfig => ({
    ...DEFAULT_FULL_CONFIG,
    ...config,
})

export const createChromeSingleConfig = (config?: Partial<IChromeSingleConfig>): IChromeSingleConfig => ({
    ...DEFAULT_SINGLE_CONFIG,
    ...config,
})

export const createImportConfig = (config?: Partial<IStoreConfig>): IStoreConfig => ({
    url: 'some-url',
    quiet: false,
    ...config,
})

export const createExportConfig = (config?: Partial<IExportConfig>): IExportConfig => ({
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

export const createNodeWithChildren = (...children: Array<Partial<NodeParserNode>>): NodeParserNode => ({
    childNodes: [
        ...children,
    ],
} as NodeParserNode)

export const createGetChromeDownloadUrlReturn = (settings?: Partial<GetChromeDownloadUrlReturn>): GetChromeDownloadUrlReturn => ({
    chromeUrl: 'chromeUrl',
    selectedVersion: new MappedVersion(10, 0, 0, 0, false),
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
