import { ComparableVersion } from './commons/ComparableVersion'

export type OS = 'win' | 'linux' | 'mac'
export type ExtendedOS = OS | 'darwin' | 'win32'

export type Arch = 'x86' | 'x64'

export interface IStoreConfigWrapper {
    action: 'importStore'
    config: IStoreConfig
}

export interface IChromeConfigWrapper {
    action: 'loadChrome'
    config: IChromeConfig
}

export interface IExportConfigWrapper {
    action: 'exportStore'
    config: IExportConfig
}

export interface IChromeConfig {
    min: ComparableVersion
    max: ComparableVersion
    results: number
    os: OS
    arch: Arch
    onFail: 'nothing' | 'increase' | 'decrease'
    autoUnzip: boolean
    interactive: boolean
    store: boolean
    download: boolean
    hideNegativeHits: boolean
    downloadFolder: string | null
    onlyNewestMajor: boolean
    single: string | null
    inverse: boolean
}

export interface IStoreConfig {
    url: string
}

export interface IExportConfig {
    path?: string
}

export type ConfigWrapper = IStoreConfigWrapper | IChromeConfigWrapper | IExportConfigWrapper

export interface IMappedVersion {
    value: string
    comparable: ComparableVersion
    disabled: boolean
}

export interface IComparableVersion {
    major: number
    minor: number
    branch: number
    patch: number
}

export enum Compared {
    GREATER,
    LESS,
    EQUAL,
}

export interface IMetadata {
    kind: string
    mediaLink: string
    name: string
    size: string
    updated: string
    metadata: {
        'cr-commit-position': string
        'cr-commit-position-number': string
        'cr-git-commit': string
    }
}

export interface IMetadataResponse {
    kind: string
    items: IMetadata[]
}

export interface LoggerConfig {
    start: string
    success: string | TextFunction
    fail: string | TextFunction
}

export interface ProgressConfig {
    start: string
    success: string
    fail: string
    showNumeric?: boolean
    barLength?: number
    steps?: number
    unit?: string
}

export type Store = {
    [p in OS]: {
        x86: string[],
        x64: string[]
    }
}

export type StoreSize = {
    [p in OS]: number
}

export type TextFunction = (key: string) => string

export interface IDownloadSettings {
    chromeUrl: string | undefined
    selectedVersion: string | undefined
    filenameOS: string
}

export interface IVersion {
    major: number
    minor: number
    branch: number
    patch: number
}

export interface IVersionWithDisabled extends IVersion {
    disabled: boolean
}
