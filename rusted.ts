import { readConfig } from './config/config'
import { downloadChromium } from './download'
import { IChromeConfig, IStoreConfig } from './interfaces'
import { logger } from './log/spinner'
import { importAndMergeLocalstore } from './store/importStore'
import { NoChromiumDownloadError } from './errors';

async function main(): Promise<void> {
    const configWrapper = readConfig(process.argv, process.platform)

    if (configWrapper.action === 'importStore') {
        const config: IStoreConfig = configWrapper.config
        await importAndMergeLocalstore(config)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        try {
            await downloadChromium(config)
        } catch (e) {
            debugger
            if (e instanceof NoChromiumDownloadError) {
                process.exit(1)
            } else {
                throw e
            }
        }
    } else {
        logger.error(`Failed to read config: ${configWrapper}`)
    }
}

main().catch(error => {
    /*eslint-disable-next-line no-console */
    console.error(error)
})
