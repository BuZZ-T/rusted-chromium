import * as fs from 'fs'
import { existsSync } from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { IListStore } from '../interfaces/store.interfaces'
import { Store } from './Store'

const STORE_FILE = path.join(__dirname, '..', LOCAL_STORE_FILE)

const readFile = promisify(fs.readFile)

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
