/* eslint-disable-next-line import/no-namespace */
import * as prompts from 'prompts'
import { logger } from 'yalpt'

import { Compared } from './interfaces/enums'
import type { IChromeFullConfig } from './interfaces/interfaces'
import type { Nullable } from './interfaces/interfaces'
import type { ComparableVersion } from './public_api'
import type { Release } from './releases/release.types'

/**
 * Lets the user select a version via CLI prompt and returns it.
 * If the amount of results in the config is set to 1, the first version is returned
 *
 * @param versions A decensding sorted Array of versions
 * @param config
 */
export async function userSelectedVersion(releases: Release[], config: IChromeFullConfig, notAvailableVersions: Set<ComparableVersion>): Promise<Nullable<Release>> {
    if (releases.length === notAvailableVersions.size) {
        if (config.results === 1) {
            logger.warn('--max-results is set to 1, but version is not available!')
        } else {
            logger.warn('All versions in the range are disabled, try a different range and amount!')
        }
        return null
    }

    if (config.results === 1) {
        if (releases[0]) {
            logger.debug(`results is set to 1, returning first version: ${releases[0].version.toString()}`)
            return releases[0]
        }
        logger.error('results is set to 1, but no version found!')
        return null
    }

    const choices = releases.map((release): prompts.Choice => ({
        title: release.version.toString(),
        value: release.version,
        disabled: notAvailableVersions.has(release.version)
    }))

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        // FIXME: Check missing warn field in PromptObject
        warn: 'This version seems to not have a binary',
        choices,
        hint: `for ${config.os} ${config.arch}`
    } as unknown as prompts.PromptObject)

    logger.debug(`User selected version: ${version}`)

    return releases.find(release => version && release.version.compare(version) === Compared.EQUAL)
}
