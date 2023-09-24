import { ComparableVersion } from '../commons/ComparableVersion'
import { ALL_FALSE_SINGLE_CONFIG } from '../commons/constants'
import type { DownloadReportEntry, IChromeSingleConfig } from '../interfaces/interfaces'
import type { Channel, OS } from '../interfaces/os.interfaces'
import type { Arch } from '../interfaces/store.interfaces'
import { logger } from '../log/logger'
import { progress } from '../log/progress'
import { spinner } from '../log/spinner'
import { downloadChromium } from './download'

// https://stackoverflow.com/questions/56933109/pick-one-key-value-pair-from-type
type PickOne<T> = { [P in keyof T]: Record<P, T[P]> & Partial<Record<Exclude<keyof T, P>, undefined>> }[keyof T]

export abstract class FluentDownloadSingle<T> {

    protected config: IChromeSingleConfig

    constructor(config?: IChromeSingleConfig) {
        this.config = {
            ...ALL_FALSE_SINGLE_CONFIG,
            ...config
        }
    }

    protected addToConfig(pConfig: PickOne<IChromeSingleConfig>): T {
        this.config = {
            ...this.config,
            ...pConfig,
        }

        return this.self()
    }

    protected abstract self(): T

    public arch(arch: Arch): T {
        this.config.arch = arch

        return this.self()
    }

    public autoUnzip(): T {
        this.config.autoUnzip = true

        return this.self()
    }

    public channel(channel: Channel): T {
        this.config.channel = channel

        return this.self()
    }

    // TODO: directly set debug mode?
    public debug(): T {
        this.config.debug = true

        return this.self()
    }

    public download(): T {
        this.config.download = true
        return this.self()
    }

    public downloadFolder(downloadFolder: string): T {
        this.config.downloadFolder = downloadFolder
        return this.self()
    }

    public os(os: OS): T {
        this.config.os = os

        return this.self()
    }

    public quiet(): T {
        logger.silent()
        spinner.silent()
        progress.silent()
        return this.self()
    }

    public noColor(): T {
        logger.noColor()
        spinner.noColor()
        progress.noColor()
        return this.self()
    }

    public noProgress(): T {
        logger.noProgress()
        spinner.noProgress()
        progress.noProgress()
        return this.self()
    }

    public store(): T {
        this.config.store = true
        return this.self()
    }
}

export class FluentDownloadSingleIncomplete extends FluentDownloadSingle<FluentDownloadSingleIncomplete> {
    public constructor() {
        super()
    }

    protected self(): FluentDownloadSingleIncomplete {
        return this
    }

    public single(comparableVersion: ComparableVersion | string): FluentDownloadSingleComplete {
        const single = typeof comparableVersion === 'string'
            ? new ComparableVersion(comparableVersion)
            : comparableVersion
        this.addToConfig({ single })
        return new FluentDownloadSingleComplete(this.config)
    }
}

export class FluentDownloadSingleComplete extends FluentDownloadSingle<FluentDownloadSingleComplete> {

    public constructor(config: IChromeSingleConfig) {
        super(config)
    }

    protected self(): FluentDownloadSingleComplete {
        return this
    }

    public start(): Promise<DownloadReportEntry[]> {
        return downloadChromium(this.config)
    }
}
