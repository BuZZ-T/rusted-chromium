import * as fs from 'fs'
import { existsSync } from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { ComparableVersion } from '../commons/ComparableVersion'
import { LOCAL_STORE_FILE } from '../commons/constants'
import { Store, Arch } from '../interfaces/interfaces'
import { OS } from '../interfaces/os.interfaces'
import { sortStoreEntries } from '../utils'

const STORE_FILE = path.join(__dirname, '..', LOCAL_STORE_FILE)

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const EMPTY_STORE: Store = {
    linux: {
        x64: [],
        x86: [],
    },
    mac: {
        x64: [],
        x86: [],
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
    let currentStore: Store
    try {
        currentStore = JSON.parse(currentStoreJson)
    } catch {
        currentStore = EMPTY_STORE
    }
    return currentStore
}

export async function storeNegativeHit(version: ComparableVersion, os: OS, arch: Arch): Promise<void> {
    const currentStore = await store.loadStore()
    
    if (!new Set(currentStore[os][arch]).has(version.toString())) {
        currentStore[os][arch].push(version.toString())

        const sortedStore = sortStoreEntries(currentStore)
        await writeFile(STORE_FILE, JSON.stringify(sortedStore, null, 4))
    }
}

const store = {
    loadStore,
    storeNegativeHit,
}

export default store
