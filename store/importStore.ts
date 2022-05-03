import { writeFile, readFile, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

import { LOCAL_STORE_FILE } from '../commons/constants'
import type { IStoreConfig } from '../interfaces/interfaces'
import type { StoreSize } from '../interfaces/store.interfaces'
import { DebugMode, logger } from '../log/logger'
import { downloadStore } from './downloadStore'
import { readStoreFile } from './readStore'
import type { Store } from './Store'

const writeFilePromise = promisify(writeFile)
const readFilePromise = promisify(readFile)

const localStoreFilePath = join(__dirname, '..', LOCAL_STORE_FILE)

export async function importAndMergeLocalstore(config: IStoreConfig): Promise<StoreSize> {
    if(config.debug) {
        logger.setDebugMode(DebugMode.DEBUG)
    }

    const isURL = config.url.startsWith('http://') || config.url.startsWith('https://')

    const store = isURL
        ? await downloadStore(config, LOCAL_STORE_FILE)
        : await readStoreFile(config)

    if (existsSync(localStoreFilePath)) {
        const localStore = await readFilePromise(LOCAL_STORE_FILE, { encoding: 'utf-8' })

        const sortedStore = store.merge(JSON.parse(localStore))

        await storeStoreFile(sortedStore)

        return sortedStore.size()
    } else {
        await storeStoreFile(store)
        return store.size()
    }
}

async function storeStoreFile(store: Store): Promise<void> {
    return writeFilePromise(localStoreFilePath, store.toMinimalFormattedString())
}
