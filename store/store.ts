import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { OS, Store, IMappedVersion, Arch } from '../interfaces'
import { sortStoreEntries } from '../utils'

const STORE_FILE = path.join(__dirname, '..', LOCAL_STORE_FILE)

const exists = promisify(fs.exists)
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

export async function disableByStore(versions: IMappedVersion[], os: OS, arch: Arch): Promise<IMappedVersion[]> {
    const currentStore = await store.loadStore()

    const storeForOS = new Set(currentStore[os][arch])

    return versions.map(version => ({
        ...version,
        disabled: storeForOS.has(version.value)
    }))
}

export async function loadStore(): Promise<Store> {
    const currentStoreJson = await exists(STORE_FILE)
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

export async function storeNegativeHit(version: IMappedVersion, os: OS, arch: Arch): Promise<any> {
    const currentStore = await store.loadStore()
    
    if (!new Set(currentStore[os][arch]).has(version.value)) {
        currentStore[os][arch].push(version.value)

        const sortedStore = sortStoreEntries(currentStore)
        await writeFile(STORE_FILE, JSON.stringify(sortedStore, null, 4))
    }
}

const store = {
    disableByStore,
    loadStore,
    storeNegativeHit,
}

export default store
