import { writeFile, readFile, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { IStoreConfig, Store, StoreSize } from '../interfaces'
import { sortStoreEntries } from '../utils'
import { downloadStore } from './downloadStore'
import { readStoreFile } from './readStore'

const writeFilePromise = promisify(writeFile)
const readFilePromise = promisify(readFile)

const localStoreFilePath = join(__dirname, '..', LOCAL_STORE_FILE)

export async function importAndMergeLocalstore(config: IStoreConfig): Promise<StoreSize> {
    const isURL = config.url.startsWith('http://') || config.url.startsWith('https://')

    const store = isURL
        ? await downloadStore(config, LOCAL_STORE_FILE)
        : await readStoreFile(config)

    if (!store) {
        return Promise.reject()
    }

    if (existsSync(localStoreFilePath)) {
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
    return writeFilePromise(localStoreFilePath, JSON.stringify(store, null, 2))
}
