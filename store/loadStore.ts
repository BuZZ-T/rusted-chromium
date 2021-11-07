import { existsSync, readFile as fsReadFile } from 'fs'
import { join as pathJoin } from 'path'
import { promisify } from 'util'

import { LOCAL_STORE_FILE } from '../commons/constants'
import type { IListStore } from '../interfaces/store.interfaces'
import { Store } from './Store'

const STORE_FILE = pathJoin(__dirname, '..', LOCAL_STORE_FILE)

const readFile = promisify(fsReadFile)

const EMPTY_STORE: IListStore = {
    linux: {
        x64: [],
        x86: [],
    },
    mac: {
        x64: [],
        arm: [],
    },
    win: {
        x64: [],
        x86: [],
    },
}

export async function loadStore(): Promise<Store> {
    // FIXME: exists is deprecated, use existsSync
    const currentStoreJson = existsSync(STORE_FILE)
        ? await readFile(STORE_FILE, 'utf8')
        : JSON.stringify(EMPTY_STORE)
    let currentStore: IListStore
    try {
        currentStore = JSON.parse(currentStoreJson)
    } catch {
        currentStore = EMPTY_STORE
    }
    return new Store(currentStore)
}
