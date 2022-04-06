import { parse, HTMLElement as NodeParserHTMLElement } from 'node-html-parser'

import { fetchBranchPosition, fetchChromeUrl, fetchChromiumTags } from './api'
import { SEARCH_BINARY } from './commons/loggerTexts'
import { MappedVersion } from './commons/MappedVersion'
import { Compared } from './interfaces/enums'
import type { ContinueFetchingChromeUrlReturn, GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig, IChromeConfig, Nullable } from './interfaces/interfaces'
import type { IOSSettings } from './interfaces/os.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import { logger } from './log/logger'
import { spinner } from './log/spinner'
import { userSelectedVersion } from './select'
import { Store } from './store/Store'
import { storeNegativeHit } from './store/storeNegativeHit'
import { detectOperatingSystem } from './utils'
import { compareComparableVersions, sortDescendingMappedVersions } from './utils/sort.utils'

export async function getChromeDownloadUrl(config: IChromeConfig, mappedVersions: MappedVersion[]): Promise<GetChromeDownloadUrlReturn> {
    const oSSetting = detectOperatingSystem(config)

    if (config.single !== null) {
        return getChromeUrlForSingle(config, oSSetting, mappedVersions[0])
    } else {
        return getChromeUrlForFull(config, oSSetting, mappedVersions)
    }
}

async function continueFetchingChromeUrl(config: IChromeFullConfig, osSetting: OSSetting, selectedVersion: Nullable<MappedVersion>, mappedVersions: MappedVersion[]): Promise<ContinueFetchingChromeUrlReturn> {

    let chromeUrl: string | undefined

    do {
        if (!selectedVersion) {
            // no version to check for binary available, exiting...
            break
        }

        if (!selectedVersion.disabled) {
            chromeUrl = await fetchChromeUrlForVersion(config, osSetting, selectedVersion)

            if (chromeUrl && config.download) {
                // chrome url found, ending loop
                spinner.success()
                return { chromeUrl, selectedVersion }
            }
        }

        await storeIfNoBinary(config, chromeUrl, selectedVersion)

        if (!chromeUrl && !selectedVersion.disabled) {
            spinner.error()
        }

        if (chromeUrl && !config.download) {
            logger.warn('Not downloading binary.')
        }

        const sVersion: MappedVersion = selectedVersion
        const index = mappedVersions.findIndex(mappedVersion => mappedVersion.value === sVersion.value)

        switch (config.onFail) {
            case 'increase': {
                if (index > 0) {
                    selectedVersion = mappedVersions[index - 1]
                    if (!selectedVersion.disabled) {
                        logger.info(`Continue with next higher version "${selectedVersion.value}"`)
                    }
                } else {
                    return { chromeUrl: undefined, selectedVersion: undefined }
                }
                break
            }
            case 'decrease': {
                if (index < mappedVersions.length - 1) {
                    const nextVersion = mappedVersions[index + 1]
                    selectedVersion = nextVersion
                    if (!selectedVersion.disabled) {
                        logger.info(`Continue with next lower version "${selectedVersion.value}"`)
                    }
                } else {
                    return { chromeUrl: undefined, selectedVersion: undefined }
                }
                break
            }
            case 'nothing': {
                selectedVersion = await userSelectedVersion(mappedVersions, config)
            }
        }
    } while (!chromeUrl || !config.download)

    return { chromeUrl, selectedVersion }
}

async function getChromeUrlForFull(config: IChromeFullConfig, osSettings: OSSetting, mappedVersions: MappedVersion[]): Promise<GetChromeDownloadUrlReturn> {

    const isAutoSearch = !config.interactive && config.onFail === 'decrease'

    const version = isAutoSearch
        ? mappedVersions[0]
        : await userSelectedVersion(mappedVersions, config)

    if (isAutoSearch && !!version) {
        logger.info(`Auto-searching with version ${version.value}`)
    }

    const { chromeUrl, selectedVersion } = await continueFetchingChromeUrl(config, osSettings, version, mappedVersions)

    return { chromeUrl, selectedVersion, filenameOS: osSettings.filename }
}

async function getChromeUrlForSingle(config: IChromeSingleConfig, oSSetting: OSSetting, selectedVersion: MappedVersion): Promise<GetChromeDownloadUrlReturn> {
    const chromeUrl = await fetchChromeUrlForVersion(config, oSSetting, selectedVersion)

    await storeIfNoBinary(config, chromeUrl, selectedVersion)

    return {
        chromeUrl,
        filenameOS: oSSetting.filename,
        selectedVersion,
    }
}

async function fetchChromeUrlForVersion(config: IChromeConfig, osSettings: IOSSettings, version: MappedVersion): Promise<string | undefined> {
    const branchPosition = await fetchBranchPosition(version.value)
    spinner.start(SEARCH_BINARY)
    const chromeUrl = await fetchChromeUrl(branchPosition, osSettings)

    if (chromeUrl && config.download) {
        spinner.success()
    }

    return chromeUrl

}

async function storeIfNoBinary(config: IChromeConfig, chromeUrl: string | undefined, version: MappedVersion): Promise<void> {
    if (!chromeUrl && !version.disabled) {
        spinner.error()
        if (config.store) {
            version.disable()
            // TODO: remove await?
            await storeNegativeHit(version.comparable, config.os, config.arch)
        }
    }
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

export function mapVersions(versions: string[], config: IChromeConfig, store: Store): MappedVersion[] {
    if (config.single !== null) {
        return [new MappedVersion(config.single, false)]
    }

    const versionSet = store.getBy(config.os, config.arch)

    const filteredVersions = versions
        .map(version => new MappedVersion(version, versionSet.has(version)))
        .filter(version => !config.hideNegativeHits || !version.disabled)
        .filter(version => compareComparableVersions(version.comparable, config.min) !== Compared.LESS
            && compareComparableVersions(version.comparable, config.max) !== Compared.GREATER)
        .sort(sortDescendingMappedVersions)

    // Don't reduce the amount of filtered versions when --only-newest-major is set
    // because the newest available major version might be disabled for the current os 
    const limitedVersions = config.onlyNewestMajor
        ? filteredVersions
        : filteredVersions.slice(0, Number(config.results))

    return config.inverse
        ? limitedVersions.reverse()
        : limitedVersions
}
