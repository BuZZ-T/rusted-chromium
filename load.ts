import { join } from 'path'
import { promisify } from 'util'
import * as fs from 'fs'

import { fetchLocalStore } from './api'
import { LOAD_CONFIG } from './constants'
import { logger } from './loggerSpinner'
import { IStoreConfig } from './interfaces'

const writeFilePromise = promisify(fs.writeFile)

/**
 * Downloads the localstore.json file an places it in the work directory of rusted chromium.
 * Adds "localstore.json" to the URL if it's not present
 * @param url 
 */
export async function downloadStore(config: IStoreConfig, destinationPath: string): Promise<void> {
    let url = config.url
    
    if (url.endsWith('/')) {
        url = `${url}${destinationPath}`
    }

    logger.start(LOAD_CONFIG)

    fetchLocalStore(url).then(storeFile => {
        logger.success()
        return writeFilePromise(join(__dirname, destinationPath), storeFile)
    }).catch(err => {
        logger.error()
        if (err.message && err.path) {
            logger.error(`${err.message}: ${err.path}`)
        } else {
            logger.error(err)
        }
    })
}

const load = {
    downloadStore,
}

export default load
