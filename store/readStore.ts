import { IStoreConfig, Store } from '../interfaces'
import { existsSync, readFile } from 'fs'
import { promisify } from 'util'
import { logger } from '../loggerSpinner'
import { READ_CONFIG } from '../constants'

const readFilePromise = promisify(readFile)

/**
 * Reads a store file from a given path on the local file system
 * @param config 
 */
export async function readStoreFile(config: IStoreConfig): Promise<Store> {
    logger.start(READ_CONFIG)
    if (!existsSync(config.url)) {
        logger.error()
        throw new Error('File does not exist!')
    }

    try {
        const store = await readFilePromise(config.url, { encoding: 'utf-8' })
        logger.success()
        return JSON.parse(store)
    } catch(e) {
        logger.error()
        throw e
    }
}
