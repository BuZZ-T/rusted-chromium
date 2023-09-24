import { readFile } from 'node:fs/promises'
import { join as pathJoin } from 'node:path'

import { LOCAL_STORE_FILE } from '../commons/constants'
import type { IListStore } from '../interfaces/store.interfaces'
import { logger } from '../log/logger'
import { existsAndIsFile } from '../utils/file.utils'
import { Store } from './Store'

const STORE_FILE = pathJoin(__dirname, '..', LOCAL_STORE_FILE)

export const EMPTY_STORE: IListStore = {
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

    logger.debug(`using store file: ${STORE_FILE}`)

    const currentStoreJson = await existsAndIsFile(STORE_FILE)
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
