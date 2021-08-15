import { fetchBranchPosition, fetchChromeUrl } from './api'
import { logger } from './log/spinner'
import { Compared, IChromeConfig, IMappedVersion } from './interfaces'
import { storeNegativeHit } from './store/store'
import { SEARCH_BINARY } from './constants'
import { detectOperatingSystem, sortDescendingIMappedVersions, compareComparableVersions } from './utils'
import { userSelectedVersion } from './select'
import { ComparableVersion } from './commons/ComparableVersion'

export async function getChromeDownloadUrl(config: IChromeConfig, mappedVersions: IMappedVersion[]): Promise<[string | undefined, string | undefined, string]> {
    const [urlOS, filenameOS] = detectOperatingSystem(config)

    const isAutoSearch = (!config.interactive && config.onFail === 'decrease') || !!config.single
      
    let selectedVersion = isAutoSearch
        ? mappedVersions[0]
        : await userSelectedVersion(mappedVersions, config)
    
    if (isAutoSearch) {
        logger.info(`Auto-searching with version ${selectedVersion?.value}`)
    }

    let chromeUrl: string | undefined

    do {
        if (!selectedVersion) {
            // no version to check for binary available, exiting...
            break
        }

        // when using --decrease-on-fail or --increase-on-fail, skip already disabled versions
        if (!selectedVersion.disabled) {
            const branchPosition = await fetchBranchPosition(selectedVersion.value)
            logger.start(SEARCH_BINARY)
            chromeUrl = await fetchChromeUrl(branchPosition, urlOS, filenameOS)
    
            if (chromeUrl && config.download) {
                // chrome url found, ending loop
                logger.success()
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

        if (config.single) {
            break
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
    } while (!config.single && (!chromeUrl || !config.download))

    return [chromeUrl, selectedVersion?.value, filenameOS]
} 

export function mapVersions(versions: string[], config: IChromeConfig, store: Set<string>): IMappedVersion[] {
    if (config.single) {
        return [{
            comparable: new ComparableVersion(config.single),
            disabled: false,
            value: config.single, 
        }]
    }
    
    const filteredVersions = versions
        .map(version => ({
            comparable: new ComparableVersion(version),
            disabled: store.has(version),
            value: version,
        }))
        .sort(sortDescendingIMappedVersions)
        .filter(version => compareComparableVersions(version.comparable, config.min) !== Compared.LESS
             && compareComparableVersions(version.comparable, config.max) !== Compared.GREATER)
        .filter(version => !config.hideNegativeHits || !version.disabled)

    // Don't reduce the amount of filtered versions when --only-newest-major is set
    // because the newest available major version might be disabled for the current os 
    const limitedVersions = config.onlyNewestMajor
        ? filteredVersions
        : filteredVersions.slice(0, Number(config.results))

    return config.inverse
        ? limitedVersions.reverse()
        : limitedVersions
}
