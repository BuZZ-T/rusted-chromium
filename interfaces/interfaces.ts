import type { ComparableVersion } from '../commons/ComparableVersion'
import type { OS } from './os.interfaces'
import type { Arch } from './store.interfaces'

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

export type IChromeConfig = IChromeFullConfig | IChromeSingleConfig

export interface IChromeFullConfig {
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
    single: null
    inverse: boolean
    quiet: boolean
}

export interface IChromeSingleConfig {
    os: OS
    arch: Arch
    single: ComparableVersion
    store: boolean
    autoUnzip: boolean
    download: boolean
    downloadFolder: string | null
    quiet: boolean
}

export interface IStoreConfig {
    url: string
    quiet: boolean
}

export interface IExportConfig {
    path?: string
    quiet: boolean
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

export type TextFunction = (key: string) => string

export interface IVersion {
    major: number
    minor: number
    branch: number
    patch: number
}

export interface IVersionWithDisabled extends IVersion {
    disabled: boolean
}

export type Nullable<T> = T | undefined | null
