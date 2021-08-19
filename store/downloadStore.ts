import { fetchLocalStore } from '../api'
import { LOAD_CONFIG } from '../constants'
import { IStoreConfig, Store } from '../interfaces'
import { logger } from '../log/spinner'

/**
 * Downloads the localstore.json file an places it in the work directory of rusted chromium.
 * Adds "localstore.json" to the URL if it's not present
 * @param url 
 */
export async function downloadStore(config: IStoreConfig, destinationPath: string): Promise<Store> {
    let url = config.url
    
    if (!url.endsWith(destinationPath)) {
        if (!url.endsWith('/')) {
            url += '/'
        }
        url = `${url}${destinationPath}`
    }

    logger.start(LOAD_CONFIG)

    return fetchLocalStore(url).then(storeFile => {
        logger.success()
        return JSON.parse(storeFile)
    }).catch(err => {
        logger.error()
        if (err?.message && err?.path) {
            logger.error(`${err.message}: ${err.path}`)
        } else {
            logger.error(err)
        }
    })
}
