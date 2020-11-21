import { ExtendedOS, OS, IChromeConfig, IComparableVersion, IMappedVersion, Compared, Store } from './interfaces';
import { logger } from './loggerSpinner'

export function detectOperatingSystem(config: IChromeConfig): [string, string] {

    const archForUrl = config.arch === 'x64' ? '_x64' : ''

    switch(config.os) {
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

export function versionToComparableVersion(version: string): IComparableVersion {
    const splitVersion = version.split('.')

    return {
        major: parseInt(splitVersion[0], 10) || 0,
        minor: parseInt(splitVersion[1], 10) || 0,
        branch: parseInt(splitVersion[2], 10) || 0,
        patch: parseInt(splitVersion[3], 10) || 0,
    }
}

/**
 * Sort comparator for IComparableVersion
 */
export function sortIMappedVersions(a: IMappedVersion, b: IMappedVersion): -1 | 0 | 1 {
    const compared = compareIComparableVersions(a.comparable, b.comparable)

    if (compared === Compared.LESS) {
        return 1
    }
    if (compared === Compared.GREATER) {
        return -1
    }

    return 0
}

/**
 * Compares two IComparableVersions with each other.
 * if version < other, the result is Compared.LESS
 * if version > other, the result is Compared.GREATER
 * if version === other, the result is Compared.EQUAL
 * 
 * @param version 
 * @param other 
 */
export function compareIComparableVersions(version: IComparableVersion, other: IComparableVersion): Compared {
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

export function mapOS(extendedOS: ExtendedOS): OS {
    switch(extendedOS) {
        case 'linux':
            return 'linux'
        case 'win32':
        case 'win':
            return 'win'
        case 'darwin':
        case 'mac':
            return 'mac'
    }
}

/**
 * Immutally sorts the entries of the given Store
 */
export function sortStoreEntries(store: Store): Store {
    return {
        win: {
            x64: [...store.win.x64].sort(),
            x86: [...store.win.x86].sort(),
        },
        linux: {
            x64: [...store.linux.x64].sort(),
            x86: [...store.linux.x86].sort(),
        },
        mac: {
            x64: [...store.mac.x64].sort(),
            x86: [...store.mac.x86].sort(),
        },
    }
}
