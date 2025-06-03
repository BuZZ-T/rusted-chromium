import { logger, spinner } from 'yalpt'

import type { ApiRelease, Release } from './release.types'
import { fetchReleases } from '../api'
import { LOAD_RELEASES } from '../commons/loggerTexts'
import { Compared } from '../interfaces/enums'
import type { IChromeConfig } from '../interfaces/interfaces'
import type { Channel, OS, Platform } from '../interfaces/os.interfaces'
import { ComparableVersion } from '../public_api'
import { sortDescendingReleases } from '../utils/sort.utils'

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

export async function loadReleases(os: OS, channel: Channel = 'Dev'): Promise<ApiRelease[]> {
    spinner.start(LOAD_RELEASES)
    logger.debug(`Loading releases for ${os} ${channel}...`)
    const platform = mapOsToPlatform(os)

    return fetchReleases(platform, channel)
        .then((releases) => (spinner.success(), releases))
        .catch(() => (spinner.error(), []))
}

function mapApiReleaseToRelease(apiRelease: ApiRelease): Release {
    return {
        branchPosition: apiRelease.chromium_main_branch_position,
        version: new ComparableVersion(apiRelease.version),
    }
}

export function mapApiReleasesToReleases(apiReleases: ApiRelease[], config: IChromeConfig): Release[] {
    if (config.single !== null) {
        const singleRelease = apiReleases.find(apiRelease => apiRelease.version === config.single.toString())

        if (!singleRelease) {
            return []
        }

        return [mapApiReleaseToRelease(singleRelease)]
    }

    const filteredVersions = apiReleases
        .map(apiRelease => mapApiReleaseToRelease(apiRelease))
        .filter(release => release.version.compare(config.min) !== Compared.LESS
            && release.version.compare(config.max) !== Compared.GREATER)
        .sort(sortDescendingReleases)

    const versionsRegardingInverse = config.inverse
        ? filteredVersions.reverse()
        : filteredVersions

    if (config.onlyNewestMajor) {
        const addedMajorVersions = new Set<number>()

        return  versionsRegardingInverse.filter((release) => {
            const major = release.version.major
            const hasMajorVersion = addedMajorVersions.has(major)

            if (!hasMajorVersion) {
                addedMajorVersions.add(major)

                return true
            }
            return false
        }).slice(0, Number(config.results))
    }

    return versionsRegardingInverse.slice(0, Number(config.results))
}
