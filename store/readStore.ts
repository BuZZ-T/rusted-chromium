import { IStoreConfig, Store } from '../interfaces'
import { existsSync, readFile } from 'fs'
import { promisify } from 'util'

const readFilePromise = promisify(readFile)

/**
 * Reads a store file from a given path on the local file system
 * @param config 
 */
export async function readStoreFile(config: IStoreConfig): Promise<Store> {
    if (!existsSync(config.url)) {
        return Promise.reject()
    }

    const store = await readFilePromise(config.url, { encoding: 'utf-8' })

    return JSON.parse(store)
}
