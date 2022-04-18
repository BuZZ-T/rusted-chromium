import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { ComparableVersion } from './ComparableVersion'

export const LOCAL_STORE_FILE = 'localstore.json'

export const DEFAULT_CONFIG_OPTIONS: IConfigOptions = {
    min: '0',
    max: '10000',

    debug: false,
    decreaseOnFail: false,
    download: true,
    hideNegativeHits: false,
    increaseOnFail: false,
    inverse: false,
    nonInteractive: false,
    onlyNewestMajor: false,
    quiet: false,
    store: true,
    unzip: false,
}

export const DEFAULT_FULL_CONFIG: IChromeFullConfig = {
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
    quiet: false,
}

export const DEFAULT_SINGLE_CONFIG: IChromeSingleConfig = {
    arch: 'x64',
    os: 'linux',
    autoUnzip: false,
    store: true,
    download: true,
    downloadFolder: null,
    single: new ComparableVersion(10, 0, 0, 0),
    quiet: false,
}
