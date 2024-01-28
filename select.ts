/* eslint-disable-next-line import/no-namespace */
import * as prompts from 'prompts'

import type { IChromeFullConfig } from './interfaces/interfaces'
import type { Nullable } from './interfaces/interfaces'
import { logger } from './log/logger'
import type { Release } from './releases/release.types'

/**
 * Lets the user select a version via CLI prompt and returns it.
 * If the amount of results in the config is set to 1, the first version is returned
 *
 * @param versions A decensding sorted Array of versions
 * @param config
 */
export async function userSelectedVersion(releases: Release[], config: IChromeFullConfig): Promise<Nullable<Release>> {
    if (releases.every(release => release.version.disabled)) {
        logger.warn('All versions in the range are disabled, try a different range and amount!')
        return null
    }
    if (config.results === 1) {
        logger.debug(`results is set to 1, returning first version: ${releases[0].version.value}`)
        return releases[0]
    }

    const versions = releases.map(release => release.version)

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        // FIXME: Check missing warn field in PromptObject
        warn: 'This version seems to not have a binary',
        choices: versions as unknown as prompts.Choice[],
        hint: `for ${config.os} ${config.arch}`
    } as unknown as prompts.PromptObject)

    return releases.find(release => release.version.value === version)
}
