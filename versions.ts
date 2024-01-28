import { fetchChromeUrl } from './api'
import { SEARCH_BINARY } from './commons/loggerTexts'
import { MappedVersion } from './commons/MappedVersion'
import type { ContinueFetchingChromeUrlReturn, GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import { ContinueFetchingChromeUrlParams } from './interfaces/function.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig, IChromeConfig } from './interfaces/interfaces'
import { DownloadReportEntry } from './interfaces/interfaces'
import type { IOSSettings } from './interfaces/os.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import { logger } from './log/logger'
import { spinner } from './log/spinner'
import { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
import { storeNegativeHit } from './store/storeNegativeHit'
import { detectOperatingSystem } from './utils'

export async function getChromeDownloadUrl(config: IChromeConfig, releases: Release[]): Promise<GetChromeDownloadUrlReturn> {
    const oSSetting = detectOperatingSystem(config)

    if (config.single !== null) {
        return getChromeUrlForSingle(config, oSSetting, releases)
    } else {
        return getChromeUrlForFull(config, oSSetting, releases)
    }
}

async function continueFetchingChromeUrl({
    config,
    releases,
    osSetting,
    selectedRelease,
}: ContinueFetchingChromeUrlParams): Promise<ContinueFetchingChromeUrlReturn> {

    let chromeUrl: string | undefined
    const report: DownloadReportEntry[] = []

    do {
        if (!selectedRelease) {
            // no version to check for binary available, exiting...
            break
        }

        if (!selectedRelease.version.disabled) {
            chromeUrl = await fetchChromeUrlForVersion(config, osSetting, selectedRelease)

            report.push({
                binaryExists: !!chromeUrl,
                download: config.download,
                release: selectedRelease,
            })

            if (chromeUrl) {
                if (config.download) {
                    return { chromeUrl, report, selectedRelease }
                }
            }
        } else {
            logger.warn('Already disabled version!')
            report.push({
                binaryExists: false,
                download: config.download,
                release: selectedRelease,
            })
        }

        await storeIfNoBinary(config, chromeUrl, selectedRelease.version)

        if (chromeUrl && !config.download) {
            chromeUrl = undefined
            logger.warn('Not downloading binary.')
        }

        const sRelease: Release = selectedRelease
        const index = releases.findIndex(release => release.version.value === sRelease.version.value)

        switch (config.onFail) {
            case 'increase': {
                if (index > 0) {
                    selectedRelease = releases[index - 1]
                    if (!selectedRelease.version.disabled) {
                        const higherLower = config.inverse ? 'lower' : 'higher'
                        logger.info(`Continue with next ${higherLower} version "${selectedRelease.version.value}"`)
                    }
                } else {
                    return { chromeUrl: undefined, report, selectedRelease: undefined }
                }
                break
            }
            case 'decrease': {
                if (index < releases.length - 1) {
                    selectedRelease = releases[index + 1]
                    if (!selectedRelease.version.disabled) {

                        const higherLower = config.inverse ? 'higher' : 'lower'

                        logger.info(`Continue with next ${higherLower} version "${selectedRelease.version.value}"`)
                    }
                } else {
                    return { chromeUrl: undefined, report, selectedRelease: undefined }
                }
                break
            }
            case 'nothing': {
                selectedRelease = await userSelectedVersion(releases, config)
            }
        }
    } while (!chromeUrl || !config.download)

    return { chromeUrl, report, selectedRelease }
}

async function getChromeUrlForFull(config: IChromeFullConfig, osSetting: OSSetting, releases: Release[]): Promise<GetChromeDownloadUrlReturn> {

    const isAutoSearch = !config.interactive && config.onFail === 'decrease'

    const release = isAutoSearch
        ? releases[0]
        : await userSelectedVersion(releases, config)

    if (isAutoSearch && !!release) {
        logger.info(`Auto-searching with version ${release.version.value}`)
    }

    const { chromeUrl, report, selectedRelease } = await continueFetchingChromeUrl({config, osSetting, selectedRelease: release, releases})

    return { chromeUrl, selectedRelease: selectedRelease, filenameOS: osSetting.filename, report }
}

async function getChromeUrlForSingle(config: IChromeSingleConfig, oSSetting: OSSetting, releases: Release[]): Promise<GetChromeDownloadUrlReturn> {
    const release = releases[0]
    const chromeUrl = await fetchChromeUrlForVersion(config, oSSetting, release)

    await storeIfNoBinary(config, chromeUrl, release.version)

    const report: DownloadReportEntry[] = [
        {
            binaryExists: !!chromeUrl,
            download: config.download,
            release
        }
    ]

    return {
        chromeUrl,
        filenameOS: oSSetting.filename,
        report,
        selectedRelease: release,
    }
}

async function fetchChromeUrlForVersion(config: IChromeConfig, osSettings: IOSSettings, release: Release): Promise<string | undefined> {
    logger.debug(`fetching chrome url for version ${release.version.value} (${release.branchPosition})`)
    spinner.start(SEARCH_BINARY)
    return fetchChromeUrl(release.branchPosition, osSettings)
        .then((chromeUrl) => {
            if (chromeUrl) {
                spinner.success()
            } else {
                spinner.error()
            }
            return chromeUrl
        })
        .catch(() => (spinner.error(), undefined))
}

async function storeIfNoBinary(config: IChromeConfig, chromeUrl: string | undefined, version: MappedVersion): Promise<void> {
    if (!chromeUrl && !version.disabled) {
        // disable the version in the prompt
        version.disable()
        if (config.store) {
            // TODO: remove await?
            await storeNegativeHit(version.comparable, config.os, config.arch)
        }
    }
}
