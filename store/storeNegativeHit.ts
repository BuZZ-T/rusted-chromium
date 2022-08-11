import { writeFile } from 'fs/promises'
import { join as pathJoin } from 'path'

import type { ComparableVersion } from '../commons/ComparableVersion'
import { LOCAL_STORE_FILE } from '../commons/constants'
import type { OS } from '../interfaces/os.interfaces'
import type { Arch } from '../interfaces/store.interfaces'
import { loadStore } from './loadStore'

const STORE_FILE = pathJoin(__dirname, '..', LOCAL_STORE_FILE)

export async function storeNegativeHit(version: ComparableVersion, os: OS, arch: Arch): Promise<void> {
    const currentStore = await loadStore()
    
    if (!currentStore.has(os, arch, version)) {
        currentStore.add(os, arch, version)

        await writeFile(STORE_FILE, currentStore.toMinimalFormattedString())
    }
}
