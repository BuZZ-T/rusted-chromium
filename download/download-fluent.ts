import { ComparableVersion } from '../commons/ComparableVersion'
import { ALL_FALSE_FULL_CONFIG } from '../commons/constants'
import type { IChromeFullConfig } from '../interfaces/interfaces'
import type { DownloadReportEntry } from '../interfaces/interfaces'
import type { Channel, OS } from '../interfaces/os.interfaces'
import type { Arch } from '../interfaces/store.interfaces'
import { downloadChromium } from './download'

/**
 * Allows to setup the configuration for downloading rusted-chromium via a fluent interface.
 * If a value is not set, it defaults to "false"
 */
export class FluentDownload {

    private config: IChromeFullConfig

    public constructor() {
        this.config  = {
            ...ALL_FALSE_FULL_CONFIG,
        }
    }

    private addToConfig(pConfig: Partial<IChromeFullConfig>): FluentDownload {
        this.config = {
            ...this.config,
            ...pConfig,
        }

        return this
    }

    public arch(arch: Arch): FluentDownload {
        return this.addToConfig({ arch })
    }

    public autoUnzip(): FluentDownload {
        return this.addToConfig({ autoUnzip: true })
    }

    public channel(channel: Channel): FluentDownload {
        return this.addToConfig({ channel })
    }

    public debug(): FluentDownload {
        return this.addToConfig({ debug: true })
    }

    public download(): FluentDownload {
        return this.addToConfig({ download: true })
    }

    public downloadFolder(downloadFolder: string): FluentDownload {
        return this.addToConfig({ downloadFolder })
    }

    public hideNegativeHits(): FluentDownload {
        return this.addToConfig({ hideNegativeHits: true })
    }

    public interactive(): FluentDownload {
        return this.addToConfig({ interactive: true })
    }

    public inverse(): FluentDownload {
        return this.addToConfig({ inverse: true })
    }

    public max(comparableVersion: string | ComparableVersion): FluentDownload {
        const max = typeof comparableVersion === 'string'
            ? new ComparableVersion(comparableVersion)
            : comparableVersion
        return this.addToConfig({ max })
    }

    public min(comparableVersion: string | ComparableVersion): FluentDownload {
        const min = typeof comparableVersion === 'string'
            ? new ComparableVersion(comparableVersion)
            : comparableVersion
        return this.addToConfig({ min })
    }

    public onFail(onFail: 'nothing' | 'increase' | 'decrease'): FluentDownload {
        return this.addToConfig({ onFail })
    }

    public onlyNewestMajor(): FluentDownload {
        return this.addToConfig({ onlyNewestMajor: true })
    }

    public os(os: OS): FluentDownload {
        return this.addToConfig({ os })
    }

    public quiet(): FluentDownload {
        return this.addToConfig({ quiet: true })
    }

    public results(results: number): FluentDownload {
        return this.addToConfig({ results })
    }

    public store(): FluentDownload {
        return this.addToConfig({ store: true })
    }

    public start(): Promise<DownloadReportEntry[]> {
        return downloadChromium(this.config)
    }
}
