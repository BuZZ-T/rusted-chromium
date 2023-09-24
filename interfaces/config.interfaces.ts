import type { Channel, ExtendedOS } from './os.interfaces'

export interface IConfigOptions {
    channel: Channel

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
    ignoreStore: boolean,
    download: boolean
    loadStore?: string,

    hideNegativeHits: boolean,

    folder?: string,
    onlyNewestMajor: boolean
    single?: string,
    inverse: boolean,

    list: boolean,
    color: boolean,
    progress: boolean,

    debug: boolean,

    quiet: boolean,
}
