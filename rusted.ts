import { readConfig } from './config/config'
import { downloadChromium } from './download/download'
import type { IChromeConfig, IStoreConfig, IExportConfig } from './interfaces/interfaces'
import { logger } from './log/logger'
import { progress } from './log/progress'
import { spinner } from './log/spinner'
import { exportStore } from './store/exportStore'
import { importAndMergeLocalstore } from './store/importStore'

export async function rusted(args: string[], platform: NodeJS.Platform): Promise<void> {
    const configWrapper = readConfig(args, platform)

    if (configWrapper.config.quiet) {
        logger.silent()
        progress.silent()
        spinner.silent()
    }

    if(!configWrapper.config.color) {
        logger.noColor()
        progress.noColor()
        spinner.noColor()
    }

    if (configWrapper.action === 'importStore') {
        const config: IStoreConfig = configWrapper.config
        await importAndMergeLocalstore(config)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        await downloadChromium(config)
    } else if (configWrapper.action === 'exportStore') {
        const config: IExportConfig = configWrapper.config
        exportStore(config, process.stdout)
    } else {
        logger.error(`Failed to read config: ${JSON.stringify(configWrapper)}`)
    }
}
