export interface IConfig {
    min: number
    max: number
    results: string
    os: string
    arch: 'x86' | 'x64'
    onFail: 'nothing' | 'increase' | 'decrease'
    autoUnzip: boolean
    interactive: boolean
}

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
