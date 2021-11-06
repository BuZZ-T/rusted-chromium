import { readConfig } from './config/config'
import { downloadChromium } from './download'
import { IChromeConfig, IStoreConfig, IExportConfig } from './interfaces/interfaces'
import { logger } from './log/spinner'
import { exportStore } from './store/exportStore'
import { importAndMergeLocalstore } from './store/importStore'

export async function rusted(args: string[], platform: NodeJS.Platform): Promise<void> {
    const configWrapper = readConfig(args, platform)

    if (configWrapper.config.quiet) {
        logger.silent()
    }

    if (configWrapper.action === 'importStore') {
        const config: IStoreConfig = configWrapper.config
        await importAndMergeLocalstore(config)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        await downloadChromium(config)
    } else if (configWrapper.action === 'exportStore') {
        const config: IExportConfig = configWrapper.config
        await exportStore(config)
    } else {
        logger.error(`Failed to read config: ${JSON.stringify(configWrapper)}`)
    }
}
