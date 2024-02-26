import { ComparableVersion } from '../commons/ComparableVersion'
import { Compared } from '../interfaces/enums'
import type { Release } from '../releases/release.types'

/**
 * Ascending sort comparator for ComparableVersion
 */
export function sortAscendingComparableVersions(a: ComparableVersion, b: ComparableVersion): -1 | 0 | 1 {
    const compared = a.compare(b)

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
    const compared = a.compare(b)

    if (compared === Compared.LESS) {
        return 1
    }
    if (compared === Compared.GREATER) {
        return -1
    }

    return 0
}

export const sortDescendingReleases = (a: Release, b: Release): -1 | 0 | 1 => sortDescendingComparableVersions(a.version, b.version)
