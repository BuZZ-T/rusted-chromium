export interface IConfig {
    min: number
    max: number
    results: string
    os: string | null
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
