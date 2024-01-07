import { HTMLElement as NodeParserHTMLElement, Node as NodeParserNode } from 'node-html-parser'
import Matcher from 'node-html-parser/dist/matcher'

import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG, DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import { MappedVersion } from '../commons/MappedVersion'
import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { GetChromeDownloadUrlReturn } from '../interfaces/function.interfaces'
import type { IChromeFullConfig, IExportConfig, IStoreConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { PrinterWriteStream } from '../interfaces/printer.interfaces'
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
    color: true,
    debug: false,
    quiet: false,
    url: 'some-url',
    ...config,
})

export const createExportConfig = (config?: Partial<IExportConfig>): IExportConfig => ({
    color: true,
    debug: false,
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
    report: [],
    ...settings,
})

export const createNodeParserHTMLElement = <T extends NodeParserHTMLElement[], U extends [selector: string | Matcher]>(querySelectorAllMock: jest.Mock<T, U>): NodeParserHTMLElement & { valid: boolean } => {
    const element = new NodeParserHTMLElement('html', {}) as NodeParserHTMLElement & { valid: boolean }
    element.valid = true
    element.querySelectorAll = querySelectorAllMock

    return element
}

export const createStdioMock = (): jest.MaybeMockedDeep<PrinterWriteStream> => ({
    write: jest.fn(),
    clearLine: jest.fn(),
    cursorTo: jest.fn(),
    moveCursor: jest.fn(),
})
