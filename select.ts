import * as prompts from 'prompts'

import { MappedVersion } from './commons/MappedVersion'
import { IChromeConfig } from './interfaces'

/**
 * Lets the user select a version via CLI prompt and returns it.
 * If the amount of results in the config is set to 1, the first version is returned
 * 
 * @param versions A decensding sorted Array of versions
 * @param config 
 */
export async function userSelectedVersion(versions: MappedVersion[], config: IChromeConfig): Promise<MappedVersion | null> {
    if (config.results === 1) {
        return versions[0]?.disabled ? null : versions[0] || null
    }

    if (config.onlyNewestMajor) {
        versions = versions.filter((version, index, versionArray) => {
            const previous = versionArray[index - 1]
            const previousMajor = previous?.value?.split('.')[0]
            const currentMajor = version.value.split('.')[0]
            return (currentMajor !== previousMajor || previous.disabled) && !version.disabled
        }).slice(0, Number(config.results))
    }

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        // FIXME: Check missing warn field in PromptObject
        warn: 'This version seems to not have a binary',
        choices: versions as unknown as prompts.Choice[],
        hint: `for ${config.os} ${config.arch}`
    } as unknown as prompts.PromptObject)

    return versions.find(v => v.value === version) || null
}
