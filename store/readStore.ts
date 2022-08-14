import { readFile } from 'node:fs/promises'

import { READ_CONFIG } from '../commons/loggerTexts'
import type { IStoreConfig } from '../interfaces/interfaces'
import { spinner } from '../log/spinner'
import { existsAndIsFile } from '../utils/file.utils'
import { Store } from './Store'

/**
 * Reads a store file from a given path on the local file system
 * @param config 
 */
export async function readStoreFile(config: IStoreConfig): Promise<Store> {
    spinner.start(READ_CONFIG)
    if (!(await existsAndIsFile(config.url))) {
        const reason = 'File does not exist'
        spinner.error(reason)
        throw new Error(reason)
    }

    try {
        const store = await readFile(config.url, { encoding: 'utf-8' })
        const parsedStore = JSON.parse(store)
        spinner.success()
        return new Store(parsedStore)
    } catch (e) {
        if (e instanceof SyntaxError) {
            spinner.error('Unable to parse JSON file')
        } else if (e && typeof e === 'object') {
            spinner.error(e.toString())
        } else {
            spinner.error(e as string)
        }
        throw e
    }
}
