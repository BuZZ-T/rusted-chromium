import { normalize } from 'path'
import { IChromeConfig } from './interfaces'

const DEFAULT_CONFIG: IChromeConfig = {
    arch: "x64",
    autoUnzip: false,
    download: false,
    downloadFolder: null,
    downloadUrl: null,
    hideNegativeHits: false,
    interactive: false,
    max: Infinity,
    min: 0,
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: "linux",
    results: Infinity,
    store: false,

}

export const createChromeConfig = (config?: Partial<IChromeConfig>) => ({
    ...DEFAULT_CONFIG,
    ...config,
})
