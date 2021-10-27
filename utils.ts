import { ComparableVersion } from './commons/ComparableVersion'
import { MappedVersion } from './commons/MappedVersion'
import { IChromeConfig, Compared, TextFunction, IVersion, IVersionWithDisabled } from './interfaces/interfaces'
import { OSSetting, OS, ExtendedOS } from './interfaces/os.interfaces'
import { ISetStore, IListStore } from './interfaces/store.interfaces'

export function detectOperatingSystem(config: IChromeConfig): OSSetting {

    const is64Bit = config.arch === 'x64'

    switch (config.os) {
        case 'linux':
            return is64Bit
                ? {
                    url: 'Linux_x64',
                    filename: 'linux'
                }
                : {
                    url: 'Linux',
                    filename: 'linux'
                }
        case 'win':
            return is64Bit
                ? {
                    url: 'Win_x64',
                    filename: 'win'
                }
                : {
                    url: 'Win',
                    filename: 'win'
                }
        case 'mac':
            return config.arch === 'arm'
                ? {
                    url: 'Mac_Arm',
                    filename: 'mac'
                }
                : {
                    url: 'Mac',
                    filename: 'mac'
                }
        default:
            throw new Error(`Unsupported operation system: ${config.os}`)
    }
}

/**
 * Descending sort comparator for MappedVersion
 */
export function sortDescendingMappedVersions(a: MappedVersion, b: MappedVersion): -1 | 0 | 1 {
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
 * Ascending sort comparator for MappedVersion
 */
export const sortAscendingMappedVersions = (a: MappedVersion, b: MappedVersion): -1 | 0 | 1 => sortAscendingComparableVersions(a.comparable, b.comparable)

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

export function isTextFunction(value: string | TextFunction | undefined): value is TextFunction {
    return typeof value === 'function'
}

export function isIVersion(value: unknown): value is IVersion {
    return typeof (value as IVersion).major === 'number'
        && typeof (value as IVersion).minor === 'number'
        && typeof (value as IVersion).branch === 'number'
        && typeof (value as IVersion).patch === 'number'
}

export function isIVersionWithDisabled(value: unknown): value is IVersionWithDisabled {
    return isIVersion(value) && typeof (value as IVersionWithDisabled).disabled === 'boolean'
}

export function setStoreToListStore(setStore: ISetStore): IListStore {
    return {
        linux: {
            x64: [...setStore.linux.x64],
            x86: [...setStore.linux.x86],
        },
        win: {
            x64: [...setStore.win.x64],
            x86: [...setStore.win.x86],
        },
        mac: {
            x64: [...setStore.mac.x64],
            arm: [...setStore.mac.arm],
        },
    }
}
