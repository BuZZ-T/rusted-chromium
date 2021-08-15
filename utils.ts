import { ExtendedOS, OS, IChromeConfig, IMappedVersion, Compared, Store, TextFunction } from './interfaces'
import { logger } from './log/spinner'
import { ComparableVersion } from './commons/ComparableVersion'

export function detectOperatingSystem(config: IChromeConfig): [string, string] {

    const archForUrl = config.arch === 'x64' ? '_x64' : ''

    switch (config.os) {
        case 'linux':
            return [`Linux${archForUrl}`, 'linux']
        case 'win':
            return [`Win${archForUrl}`, 'win']
        case 'mac':
            if (config.arch === 'x86') {
                logger.warn('A mac version is not available for "x86" architecture, using "x64"!')
                config.arch = 'x64'
            }
            return ['Mac', 'mac']
        default:
            throw new Error(`Unsupported operation system: ${config.os}`)
    }
}

/**
 * Descending sort comparator for IMappedVersion
 */
export function sortDescendingIMappedVersions(a: IMappedVersion, b: IMappedVersion): -1 | 0 | 1 {
    const compared = compareComparableVersions(a.comparable, b.comparable)

    if (compared === Compared.LESS) {
        return 1
    }
    if (compared === Compared.GREATER) {
        return -1
    }

    return 0
}

/**
 * Ascending sort comparator for IMappedVersion
 */
export const sortAscendingIMappedVersions = (a: IMappedVersion, b: IMappedVersion): -1 | 0 | 1 => sortAscendingComparableVersions(a.comparable, b.comparable)

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

export function mapOS(extendedOS: string): OS {
    switch (extendedOS as ExtendedOS) {
        case 'linux':
            return 'linux'
        case 'win32':
        case 'win':
            return 'win'
        case 'darwin':
        case 'mac':
            return 'mac'
    }

    throw new Error(`unknown OS: ${extendedOS}`)
}

/**
 * Immutally sorts the entries of the given Store
 */
export function sortStoreEntries(store: Store): Store {
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
            x86: [...store.mac.x86].map(v => new ComparableVersion(v)).sort(sortAscendingComparableVersions).map(c => c.toString()),
        },
    }
}

export function isTextFunction(value: string | TextFunction | undefined): value is TextFunction {
    return typeof value === 'function'
}
