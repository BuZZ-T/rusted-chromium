import { fetchReleases } from '../api'
import { MappedVersion } from '../commons/MappedVersion'
import { Compared } from '../interfaces/enums'
import { IChromeConfig } from '../interfaces/interfaces'
import type { Channel, OS, Platform } from '../interfaces/os.interfaces'
import { logger } from '../log/logger'
import { ComparableVersion } from '../public_api'
import { Store } from '../store/Store'
import { sortDescendingReleases } from '../utils/sort.utils'
import type { ApiRelease, Release } from './release.types'

export function mapOsToPlatform(os: OS): Platform {
    switch (os) {
        case 'linux':
            return 'Linux'
        case 'mac':
            return 'Mac'
        case 'win':
            return 'Windows'
        default:
            return 'Linux'
    }
}

// TODO: add spinner
export async function loadReleases(os: OS, channel: Channel = 'Dev'): Promise<ApiRelease[]> {
    logger.debug(`Loading releases for ${os} ${channel}...`)
    const platform = mapOsToPlatform(os)

    const releases = await fetchReleases(platform, channel)

    return releases
}

function mapApiReleaseToRelease(apiRelease: ApiRelease, versionSet: Set<string>): Release {
    return {
        branchPosition: apiRelease.chromium_main_branch_position,
        version: new MappedVersion(apiRelease.version, versionSet.has(apiRelease.version)),
    }
}

export function mapApiReleasesToReleases(apiReleases: ApiRelease[], config: IChromeConfig, store: Store): Release[] {
    if (config.single !== null) {
        return  [{
            branchPosition: 0,
            version: new MappedVersion(config.single, false),
        }]
    }

    const versionSet = store.getBy(config.os, config.arch)

    const filteredVersions = apiReleases
        .map(apiRelease => mapApiReleaseToRelease(apiRelease, versionSet))
        .filter(release => !config.hideNegativeHits || !versionSet.has(release.version.toString()))
        .filter(release => ComparableVersion.compare(release.version.comparable, config.min) !== Compared.LESS
            && ComparableVersion.compare(release.version.comparable, config.max) !== Compared.GREATER)
        .sort(sortDescendingReleases)

    const versionsRegardingInverse = config.inverse
        ? filteredVersions.reverse()
        : filteredVersions

    if (config.onlyNewestMajor) {
        const addedMajorVersions = new Set<string>()

        return  versionsRegardingInverse.filter((release) => {
            const hasMajorVersion = addedMajorVersions.has(release.version.toString().split('.')[0])

            if (!hasMajorVersion) {
                addedMajorVersions.add(release.version.toString().split('.')[0])

                return true
            }
            return false
        }).slice(0, Number(config.results))
    }

    return versionsRegardingInverse.slice(0, Number(config.results))
}