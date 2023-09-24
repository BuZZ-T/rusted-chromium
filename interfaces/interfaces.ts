import type { ComparableVersion } from '../commons/ComparableVersion'
import type { Release } from '../releases/release.types'
import type { Channel, OS } from './os.interfaces'
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

/**
 * Configuration, which is not passed to the three actions (importAndMerge, download and export),
 * as it's interpreted beforehands.
 */
export interface IChromeGeneralConfig {
    color: boolean
    debug: boolean
    progress: boolean
    quiet: boolean
}

export interface IChromeCoreConfig extends IChromeGeneralConfig {
    arch: Arch
    autoUnzip: boolean
    channel: Channel
    download: boolean
    downloadFolder: string | null
    os: OS
    store: boolean
}

export interface IChromeFullConfig extends IChromeCoreConfig {
    hideNegativeHits: boolean
    ignoreStore: boolean
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

export interface IStoreConfig extends IChromeGeneralConfig {
    url: string
}

export interface IExportConfig extends IChromeGeneralConfig {
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
    release: Nullable<Release>
}
