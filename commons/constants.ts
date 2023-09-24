import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { ComparableVersion } from './ComparableVersion'

export const LOCAL_STORE_FILE = 'localstore.json'

export const ALL_FALSE_FULL_CONFIG: IChromeFullConfig = {
    arch: 'x64',
    autoUnzip: false,
    channel: 'Stable',
    color: false,
    debug: false,
    download: false,
    downloadFolder: null,
    hideNegativeHits: false,
    ignoreStore: false,
    interactive: false,
    inverse: false,
    list: false,
    max: new ComparableVersion(Infinity, 0, 0, 0),
    min: new ComparableVersion(-Infinity, 0, 0, 0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    progress: false,
    quiet: false,
    results: Infinity,
    single: null,
    store: false,
}

export const ALL_FALSE_SINGLE_CONFIG: IChromeSingleConfig = {
    arch: 'x64',
    autoUnzip: false,
    channel: 'Stable',
    color: false,
    debug: false,
    download: false,
    downloadFolder: null,
    os: 'linux',
    progress: false,
    quiet: false,
    single: new ComparableVersion(0, 0, 0, 0),
    store: false,
}

export const DEFAULT_CONFIG_OPTIONS: IConfigOptions = {
    channel: 'Stable',
    color: true,
    debug: false,
    decreaseOnFail: false,
    download: true,
    hideNegativeHits: false,
    ignoreStore: false,
    increaseOnFail: false,
    inverse: false,
    list: false,
    max: '10000',
    min: '0',
    nonInteractive: false,
    onlyNewestMajor: false,
    progress: true,
    quiet: false,
    store: true,
    unzip: false,
}

export const DEFAULT_FULL_CONFIG: IChromeFullConfig = {
    arch: 'x64',
    autoUnzip: false,
    channel: 'Stable',
    color: true,
    debug: false,
    download: true,
    downloadFolder: null,
    hideNegativeHits: false,
    ignoreStore: false,
    interactive: true,
    inverse: false,
    list: false,
    max: new ComparableVersion(10000, 0, 0, 0),
    min: new ComparableVersion(0, 0, 0, 0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    progress: true,
    quiet: false,
    results: 10,
    single: null,
    store: true,
}

export const DEFAULT_SINGLE_CONFIG: IChromeSingleConfig = {
    arch: 'x64',
    autoUnzip: false,
    channel: 'Stable',
    color: true,
    debug: false,
    download: true,
    downloadFolder: null,
    os: 'linux',
    progress: true,
    quiet: false,
    single: new ComparableVersion(10, 0, 0, 0),
    store: true,
}
