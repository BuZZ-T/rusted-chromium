import { ExtendedOS } from './os.interfaces'

export interface IConfigOptions {
    min: string
    max: string

    maxResults?: string

    os?: ExtendedOS

    arch?: string

    nonInteractive: boolean
    increaseOnFail: boolean
    decreaseOnFail: boolean

    importStore?: string
    exportStore?: string | boolean

    unzip: boolean
    store: boolean
    download: boolean
    loadStore?: string,

    hideNegativeHits: boolean,

    folder?: string,
    onlyNewestMajor: boolean
    single?: string,
    inverse: boolean,

    quiet: boolean,
}
