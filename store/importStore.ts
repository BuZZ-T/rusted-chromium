import * as fs from 'fs'
import { promisify } from 'util'
import { join } from 'path'

import { IStoreConfig, Store, StoreSize } from '../interfaces'
import { downloadStore } from './downloadStore'
import { readStoreFile } from './readStore'
import { LOCAL_STORE_FILE, LOAD_CONFIG, READ_CONFIG } from '../constants'
import { sortStoreEntries } from '../utils'
import { logger } from '../loggerSpinner'

const writeFilePromise = promisify(fs.writeFile)
const readFilePromise = promisify(fs.readFile)

export async function importAndMergeLocalstore(config: IStoreConfig): Promise<StoreSize> {
    const isURL = config.url.startsWith('http://') || config.url.startsWith('https://')

    const logTexts = isURL ? LOAD_CONFIG : READ_CONFIG

    logger.start(logTexts)

    const store = isURL
        ? await downloadStore(config, LOCAL_STORE_FILE)
        : await readStoreFile(config)

    if (!store) {
        logger.error()
        return Promise.reject()
    }

    logger.success()

    if (fs.existsSync(LOCAL_STORE_FILE)) {
        const localStore = await readFilePromise(LOCAL_STORE_FILE, {encoding: 'utf-8'})
        const sortedStore = sortStoreEntries(mergeStores(JSON.parse(localStore), store))
        await storeStoreFile(sortedStore)
        return Promise.resolve({
            linux: sortedStore.linux.x64.length + sortedStore.linux.x86.length,
            win: sortedStore.win.x64.length + sortedStore.win.x86.length,
            mac: sortedStore.mac.x64.length + sortedStore.mac.x86.length,
        })
    } else {
        await storeStoreFile(store)
        return Promise.resolve({
            linux: store.linux.x64.length + store.linux.x86.length,
            win: store.win.x64.length + store.win.x86.length,
            mac: store.mac.x64.length + store.mac.x86.length,
        })
    }
}

/**
 * Merges an already existing localStore with a newStore.
 */
function mergeStores(localStore: Store, newStore: Store): Store {
    return {
        win: {
            x64: [
                ...localStore.win.x64,
                ...newStore.win.x64,
            ],
            x86: [
                ...localStore.win.x86,
                ...newStore.win.x86,
            ],
        },
        linux: {
            x64: [
                ...localStore.linux.x64,
                ...newStore.linux.x64,
            ],
            x86: [
                ...localStore.linux.x86,
                ...newStore.linux.x86,
            ],
        },
        mac: {
            x64: [
                ...localStore.mac.x64,
                ...newStore.mac.x64,
            ],
            x86: [
                ...localStore.mac.x86,
                ...newStore.mac.x86,
            ],
        }
    }
}

async function storeStoreFile(store: Store): Promise<void> {
    const filename = join(__dirname, '..', LOCAL_STORE_FILE)
    return writeFilePromise(filename, JSON.stringify(store, null, 2))
}
