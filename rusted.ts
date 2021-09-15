import { readConfig } from './config/config'
import { downloadChromium } from './download'
import { IChromeConfig, IStoreConfig } from './interfaces'
import { logger } from './log/spinner'
import { importAndMergeLocalstore } from './store/importStore'

export async function rusted(args: string[], platform: NodeJS.Platform): Promise<void> {
    const configWrapper = readConfig(args, platform)

    if (configWrapper.action === 'importStore') {
        const config: IStoreConfig = configWrapper.config
        await importAndMergeLocalstore(config)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        await downloadChromium(config)
    } else {
        logger.error(`Failed to read config: ${JSON.stringify(configWrapper)}`)
    }
}
