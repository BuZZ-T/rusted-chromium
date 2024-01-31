import { fetchReleases } from '../api'
import { LOAD_RELEASES } from '../commons/loggerTexts'
import { MappedVersion } from '../commons/MappedVersion'
import { Compared } from '../interfaces/enums'
import { IChromeConfig } from '../interfaces/interfaces'
import type { Channel, OS, Platform } from '../interfaces/os.interfaces'
import { logger } from '../log/logger'
import { spinner } from '../log/spinner'
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

export async function loadReleases(os: OS, channel: Channel = 'Dev'): Promise<ApiRelease[]> {
    spinner.start(LOAD_RELEASES)
    logger.debug(`Loading releases for ${os} ${channel}...`)
    const platform = mapOsToPlatform(os)

    return fetchReleases(platform, channel)
        .then((releases) => (spinner.success(), releases))
        .catch(() => (spinner.error(), []))
}

function mapApiReleaseToRelease(apiRelease: ApiRelease, versionSet: Set<string>): Release {
    return {
        branchPosition: apiRelease.chromium_main_branch_position,
        version: new MappedVersion(apiRelease.version, versionSet.has(apiRelease.version)),
    }
}

export function mapApiReleasesToReleases(apiReleases: ApiRelease[], config: IChromeConfig, store: Store): Release[] {
    if (config.single !== null) {
        const singleRelease = apiReleases.find(apiRelease => apiRelease.version === config.single.toString())

        if (!singleRelease) {
            return []
        }

        return [mapApiReleaseToRelease(singleRelease, new Set())]
    }

    const versionSet = store.getBy(config.os, config.arch)

    const filteredVersions = apiReleases
        .map(apiRelease => mapApiReleaseToRelease(apiRelease, versionSet))
        .filter(release => !config.hideNegativeHits || !versionSet.has(release.version.value))
        .filter(release => release.version.comparable.compare(config.min) !== Compared.LESS
            && release.version.comparable.compare(config.max) !== Compared.GREATER)
        .sort(sortDescendingReleases)

    const versionsRegardingInverse = config.inverse
        ? filteredVersions.reverse()
        : filteredVersions

    if (config.onlyNewestMajor) {
        const addedMajorVersions = new Set<string>()

        return  versionsRegardingInverse.filter((release) => {
            const hasMajorVersion = addedMajorVersions.has(release.version.value.split('.')[0])

            if (!hasMajorVersion && !release.version.disabled) {
                addedMajorVersions.add(release.version.value.split('.')[0])

                return true
            }
            return false
        }).slice(0, Number(config.results))
    }

    return versionsRegardingInverse.slice(0, Number(config.results))
}
