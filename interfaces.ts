export type OS = 'win' | 'linux' | 'mac'
export type ExtendedOS = OS | 'darwin' | 'win32'

export type Arch = 'x86' | 'x64'

export interface IStoreConfigWrapper {
    action: 'loadStore'
    config: IStoreConfig
}

export interface IChromeConfigWrapper {
    action: 'loadChrome'
    config: IChromeConfig
}

export interface IChromeConfig {
    min: number
    max: number
    results: string
    os: OS
    arch: Arch
    onFail: 'nothing' | 'increase' | 'decrease'
    autoUnzip: boolean
    interactive: boolean
    store: boolean
    download: boolean
    downloadUrl: string | null
    hideNegativeHits: boolean
}

export interface IStoreConfig{
    url: string
}

export type ConfigWrapper = IStoreConfigWrapper | IChromeConfigWrapper

export interface IMappedVersion {
    value: string
    comparable: number
    disabled: boolean
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

/**
 * start / success / error
 */
export type LoggingConfig = [string, string, string?]

export type Store = {
    [p in OS]: {
        x86: string[],
        x64: string[]
    }
}
