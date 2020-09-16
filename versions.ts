import * as prompts from 'prompts'

import { fetchBranchPosition, fetchChromeUrl } from './api'
import { logger } from './loggerSpinner'
import { IChromeConfig, IMappedVersion } from './interfaces'
import { storeNegativeHit } from './store'
import { SEARCH_BINARY } from './constants'
import { detectOperatingSystem } from './utils'

export async function getChromeDownloadUrl(config: IChromeConfig, mappedVersions: IMappedVersion[]): Promise<[string | undefined, string | undefined, string]> {
    const [urlOS, filenameOS] = detectOperatingSystem(config)

    const isAutoSearch = !config.interactive && config.onFail === "decrease"
    
    let selectedVersion = isAutoSearch
        ? mappedVersions[0]
        : await userSelectedVersion(mappedVersions, config)
    
    if (isAutoSearch) {
        logger.info(`Auto-searching with version ${selectedVersion}`)
    }

    let chromeUrl: string | undefined

    do {
        if (!selectedVersion) {
            // no version to check for binary available, exiting...
            break
        }

        // when using --decreaseOnFail or --increaseOnFail, skip already disabled versions
        if (!selectedVersion.disabled) {
            const branchPosition = await fetchBranchPosition(selectedVersion.value);
            logger.start(SEARCH_BINARY)
            chromeUrl = await fetchChromeUrl(branchPosition, urlOS, filenameOS)
    
            if (chromeUrl && config.download) {
                // chrome url found, ending loop
                break
            }
        }

        const index = mappedVersions.findIndex(version => version.value === selectedVersion?.value)

        if (!chromeUrl && !selectedVersion.disabled) {
            const invalidVersion = mappedVersions[index]
            logger.error()
            invalidVersion.disabled = true
            if (config.store) {
                // TODO: remove await?
                await storeNegativeHit(invalidVersion, config.os, config.arch)
            }
        }
        
        if (chromeUrl && !config.download) {
            logger.warn('Not downloading binary.')
        }

        switch (config.onFail) {
            case 'increase':
                if (index > 0) {
                    selectedVersion = mappedVersions[index - 1]
                    if (!selectedVersion.disabled) {
                        logger.info(`Continue with next higher version "${selectedVersion.value}"`)
                    }
                } else {
                    selectedVersion = null
                }
                break
            case 'decrease':
                if (index < mappedVersions.length - 1) {
                    const nextVersion = mappedVersions[index + 1]
                    selectedVersion = nextVersion
                    if (!selectedVersion.disabled) {
                        logger.info(`Continue with next lower version "${selectedVersion.value}"`)
                    }
                } else {
                    selectedVersion = null
                }
                break
            case 'nothing':
                selectedVersion = await userSelectedVersion(mappedVersions, config)
                break
        }
    } while (!chromeUrl || !config.download)

    return [chromeUrl, selectedVersion?.value, filenameOS]
} 

/**
 * Lets the user select a version via CLI prompt and returns it.
 * If the amount of results in the config is set to 1, the first version is returned
 */
export async function userSelectedVersion(versions: IMappedVersion[], config: IChromeConfig): Promise<IMappedVersion | null> {
    if (config.results === '1') {
        return versions[0].disabled ? null : versions[0]
    }

    if (config.onlyNewestMajor) {
        versions = versions.filter((version, index, versionArray) => {
            const previous = versionArray[index - 1]
            const previousMajor = previous?.value?.split('.')[0]
            const currentMajor = version?.value?.split('.')[0]
            return (currentMajor !== previousMajor || previous?.disabled) && !version?.disabled
        }).slice(0, Number(config.results))
    }

    const { version } = await prompts({
        type: 'select',
        name: 'version',
        message: 'Select a version',
        warn: 'This version seems to not have a binary',
        choices: versions,
        hint: `for ${config.os} ${config.arch}`
    } as any)

    return versions.find(v => v.value === version) || null
}
