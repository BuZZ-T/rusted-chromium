import { IChromeConfig, IComparableVersion } from './interfaces';

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

export const createChromeConfig = (config?: Partial<IChromeConfig>) => ({
    ...DEFAULT_CONFIG,
    ...config,
})
