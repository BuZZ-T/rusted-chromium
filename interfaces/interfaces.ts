import type { ComparableVersion } from '../commons/ComparableVersion'
import { MappedVersion } from '../commons/MappedVersion'
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

export interface IChromeCoreConfig {
    color: boolean
    arch: Arch
    autoUnzip: boolean
    debug: boolean
    download: boolean
    downloadFolder: string | null
    os: OS
    quiet: boolean
    store: boolean
}

export interface IChromeFullConfig extends IChromeCoreConfig {
    color: boolean
    hideNegativeHits: boolean
    interactive: boolean
    inverse: boolean
    list: boolean
    max: ComparableVersion
    min: ComparableVersion
    onFail: 'nothing' | 'increase' | 'decrease'
    onlyNewestMajor: boolean
    results: number
    single: null
}

export interface IChromeSingleConfig extends IChromeCoreConfig {
    single: ComparableVersion
}

export interface IStoreConfig {
    color: boolean
    debug: boolean
    quiet: boolean
    url: string
}

export interface IExportConfig {
    color: boolean
    debug: boolean
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

export interface LoggerConfig<Success extends string | TextFunction, Fail extends string | TextFunction> {
    start: string
    success: Success
    fail: Fail
}

export type StringLoggerConfig = LoggerConfig<string, string> 

export type AnyLoggerConfig = LoggerConfig<string | TextFunction, string | TextFunction>

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

export interface DownloadReportEntry {
    binaryExists: boolean
    download: boolean
    version: Nullable<MappedVersion>
}
