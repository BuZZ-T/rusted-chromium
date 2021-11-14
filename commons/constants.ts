import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { LoggerConfig } from '../interfaces/interfaces'
import type { IChromeFullConfig, IChromeSingleConfig } from '../interfaces/interfaces'
import { ComparableVersion } from './ComparableVersion'

export const LOAD_CONFIG: LoggerConfig = {
    start: 'Downloading local storage file',
    success: 'localstore.json file downloaded successfully!',
    fail: 'Error downloading localstore.json',
}

export const READ_CONFIG: LoggerConfig = {
    start: 'Reading local storage file from filesystem',
    success: 'Successfully loaded localstore.json from filesystem',
    fail: reason => `Error loading localstore.json from filesystem: ${reason}`,
}

export const LOCAL_STORE_FILE = 'localstore.json'

export const RESOLVE_VERSION: LoggerConfig = {
    start: 'Resolving version to branch position...',
    success: 'Version resolved!',
    fail: 'Error resolving version!',
}

export const SEARCH_BINARY: LoggerConfig = {
    start: 'Searching for binary...',
    success: 'Binary found.',
    fail: 'No binary found!',
}

export const DEFAULT_CONFIG_OPTIONS: IConfigOptions = {
    min: '0',
    max: '10000',

    nonInteractive: false,
    hideNegativeHits: false,
    onlyNewestMajor: false,
    inverse: false,
    store: true,
    download: true,
    increaseOnFail: false,
    decreaseOnFail: false,
    unzip: false,
    quiet: false,
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
