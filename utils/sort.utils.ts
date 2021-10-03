import { ComparableVersion } from '../commons/ComparableVersion'
import type { MappedVersion } from '../commons/MappedVersion'
import { Compared } from '../interfaces/enums'
import type { IListStore } from '../interfaces/store.interfaces'

/**
 * Compares two ComparableVersions with each other.
 * if version < other, the result is Compared.LESS
 * if version > other, the result is Compared.GREATER
 * if version === other, the result is Compared.EQUAL
 * 
 * @param version 
 * @param other 
 */
export function compareComparableVersions(version: ComparableVersion, other: ComparableVersion): Compared {
    if (version.major > other.major) { return Compared.GREATER }
    if (version.major < other.major) { return Compared.LESS }

    if (version.minor > other.minor) { return Compared.GREATER }
    if (version.minor < other.minor) { return Compared.LESS }

    if (version.branch > other.branch) { return Compared.GREATER }
    if (version.branch < other.branch) { return Compared.LESS }

    if (version.patch > other.patch) { return Compared.GREATER }
    if (version.patch < other.patch) { return Compared.LESS }

    return Compared.EQUAL
}

/**
 * Ascending sort comparator for ComparableVersion 
 */
export function sortAscendingComparableVersions(a: ComparableVersion, b: ComparableVersion): -1 | 0 | 1 {
    const compared = compareComparableVersions(a, b)

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
    const compared = compareComparableVersions(a, b)

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
