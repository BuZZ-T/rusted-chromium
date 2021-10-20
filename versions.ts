import { parse, HTMLElement as NodeParserHTMLElement } from 'node-html-parser'

import { fetchBranchPosition, fetchChromeUrl, fetchChromiumTags } from './api'
import { SEARCH_BINARY } from './commons/constants'
import { MappedVersion } from './commons/MappedVersion'
import { Compared, IChromeConfig, IDownloadSettings } from './interfaces/interfaces'
import { logger } from './log/spinner'
import { userSelectedVersion } from './select'
import { storeNegativeHit } from './store/store'
import { detectOperatingSystem, sortDescendingMappedVersions, compareComparableVersions } from './utils'

export async function getChromeDownloadUrl(config: IChromeConfig, mappedVersions: MappedVersion[]): Promise<IDownloadSettings> {
    const osSettings = detectOperatingSystem(config)

    const isAutoSearch = (!config.interactive && config.onFail === 'decrease') || !!config.single

    let selectedVersion = isAutoSearch
        ? mappedVersions[0]
        : await userSelectedVersion(mappedVersions, config)

    if (isAutoSearch && !!selectedVersion) {
        logger.info(`Auto-searching with version ${selectedVersion.value}`)
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
            chromeUrl = await fetchChromeUrl(branchPosition, osSettings)

            if (chromeUrl && config.download) {
                // chrome url found, ending loop
                logger.success()
                break
            }
        }

        const sVersion: MappedVersion = selectedVersion
        const index = mappedVersions.findIndex(version => version.value === sVersion.value)

        if (!chromeUrl && !selectedVersion.disabled) {
            const invalidVersion = mappedVersions[index]
            logger.error()
            if (config.store) {
                // TODO: remove await?
                await storeNegativeHit(invalidVersion.comparable, config.os, config.arch)
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

    return { chromeUrl, selectedVersion: selectedVersion?.value, filenameOS: osSettings.filename }
}

/**
 * Parses the chromium tags and returns all chromium versions
 */
export async function loadVersions(): Promise<string[]> {
    const tags = await fetchChromiumTags()

    const parsedTags = parse(tags) as (NodeParserHTMLElement & { valid: boolean })

    const h3s = parsedTags.querySelectorAll('h3')

    let tagsHeadline: NodeParserHTMLElement | undefined
    h3s.forEach((h3: NodeParserHTMLElement) => {
        if (h3.innerHTML === 'Tags') {
            tagsHeadline = h3
        }
    })

    if (!tagsHeadline) {
        throw new Error('Tags headline not found in HTML')
    }

    const tagsList = tagsHeadline.parentNode?.childNodes?.[1]

    if (!tagsList) {
        throw new Error('No list of tags found under tags headline')
    }

    const versions: string[] = []
    tagsList.childNodes.forEach(tag => {
        versions.push(tag.text)
    })

    return versions
}

export function mapVersions(versions: string[], config: IChromeConfig, store: Set<string>): MappedVersion[] {
    if (config.single) {
        return [new MappedVersion(config.single, false)]
    }

    const filteredVersions = versions
        .map(version => new MappedVersion(version, store.has(version)))
        .sort(sortDescendingMappedVersions)
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
