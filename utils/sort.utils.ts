import { ComparableVersion } from '../commons/ComparableVersion'
import type { MappedVersion } from '../commons/MappedVersion'
import { Compared } from '../interfaces/enums'
import type { IListStore } from '../interfaces/store.interfaces'
import type { Release } from '../releases/release.types'

/**
 * Ascending sort comparator for ComparableVersion
 */
export function sortAscendingComparableVersions(a: ComparableVersion, b: ComparableVersion): -1 | 0 | 1 {
    const compared = ComparableVersion.compare(a, b)

    if (compared === Compared.GREATER) {
        return 1
    }
    if (compared === Compared.LESS) {
        return -1
    }

    return 0
}

/**
 * Descending sort comparator for ComparableVersion
 */
export function sortDescendingComparableVersions(a: ComparableVersion, b: ComparableVersion): -1 | 0 | 1 {
    const compared = ComparableVersion.compare(a, b)

    if (compared === Compared.LESS) {
        return 1
    }
    if (compared === Compared.GREATER) {
        return -1
    }

    return 0
}

/**
 * Ascending sort comparator for MappedVersion
 */
export const sortAscendingMappedVersions = (a: MappedVersion, b: MappedVersion): -1 | 0 | 1 => sortAscendingComparableVersions(a.comparable, b.comparable)

/**
* Descending sort comparator for MappedVersion
*/
export const sortDescendingMappedVersions = (a: MappedVersion, b: MappedVersion): -1 | 0 | 1 => sortDescendingComparableVersions(a.comparable, b.comparable)

/**
* Immutally sorts the entries of the given Store
*/
export function sortStoreEntries(store: IListStore): IListStore {
    return {
        win: {
            x64: [...store.win.x64].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
            x86: [...store.win.x86].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
        },
        linux: {
            x64: [...store.linux.x64].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
            x86: [...store.linux.x86].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
        },
        mac: {
            x64: [...store.mac.x64].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
            arm: [...store.mac.arm].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
        },
    }
}

export const sortDescendingReleases = (a: Release, b: Release): -1 | 0 | 1 => sortDescendingComparableVersions(a.version.comparable, b.version.comparable)
