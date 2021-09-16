import { existsSync, readFile } from 'fs'
import { promisify } from 'util'

import { READ_CONFIG } from '../commons/constants'
import { IStoreConfig, Store } from '../interfaces'
import { logger } from '../log/spinner'

const readFilePromise = promisify(readFile)

/**
 * Reads a store file from a given path on the local file system
 * @param config 
 */
export async function readStoreFile(config: IStoreConfig): Promise<Store> {
    logger.start(READ_CONFIG)
    if (!existsSync(config.url)) {
        const reason = 'File does not exist'
        logger.error(reason)
        throw new Error(reason)
    }

    try {
        const store = await readFilePromise(config.url, { encoding: 'utf-8' })
        const parsedStore = JSON.parse(store)
        logger.success()
        return parsedStore
    } catch (e) {
        if (e instanceof SyntaxError) {
            logger.error('Unable to parse JSON file')
        } else if (e && typeof e === 'object') {
            logger.error(e.toString())
        } else {
            logger.error(e as string)
        }
        throw e
    }
}
