import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { ComparableVersion } from '../commons/ComparableVersion'
import { LOCAL_STORE_FILE } from '../commons/constants'
import { OS } from '../interfaces/os.interfaces'
import { Arch } from '../interfaces/store.interfaces'
import { loadStore } from './loadStore'

const STORE_FILE = path.join(__dirname, '..', LOCAL_STORE_FILE)

const writeFile = promisify(fs.writeFile)

export async function storeNegativeHit(version: ComparableVersion, os: OS, arch: Arch): Promise<void> {
    const currentStore = await loadStore()
    
    if (!currentStore.has(os, arch, version)) {
        currentStore.add(os, arch, version)

        await writeFile(STORE_FILE, currentStore.toFormattedString())
    }
}
