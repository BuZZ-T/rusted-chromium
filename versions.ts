import { fetchChromeUrl } from './api'
import { SEARCH_BINARY } from './commons/loggerTexts'
import type { ContinueFetchingChromeUrlReturn, GetChromeDownloadUrlReturn } from './interfaces/function.interfaces'
import type { ContinueFetchingChromeUrlParams } from './interfaces/function.interfaces'
import type { IChromeFullConfig, IChromeSingleConfig, IChromeConfig } from './interfaces/interfaces'
import type { DownloadReportEntry } from './interfaces/interfaces'
import type { IOSSettings } from './interfaces/os.interfaces'
import type { OSSetting } from './interfaces/os.interfaces'
import { logger } from './log/logger'
import { spinner } from './log/spinner'
import type { ComparableVersion } from './public_api'
import type { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
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
    osSetting,
    releases,
    selectedRelease,
}: ContinueFetchingChromeUrlParams): Promise<ContinueFetchingChromeUrlReturn> {

    let chromeUrl: string | undefined
    const report: DownloadReportEntry[] = []

    const notAvailableVersions = new Set<ComparableVersion>()

    do {
        if (!selectedRelease) {
            // no version to check for binary available, exiting...
            break
        }

        if (!notAvailableVersions.has(selectedRelease.version)) {
            chromeUrl = await fetchChromeUrlForVersion(osSetting, selectedRelease)

            report.push({
                binaryExists: !!chromeUrl,
                download: config.download,
                release: selectedRelease,
            })

            if (chromeUrl && config.download) {
                return { chromeUrl, report, selectedRelease }
            }
        } else {
            logger.warn('Already disabled version!')
            report.push({
                binaryExists: false,
                download: config.download,
                release: selectedRelease,
            })
        }

        if (!chromeUrl) {
            notAvailableVersions.add(selectedRelease.version)
        }

        if (chromeUrl && !config.download) {
            chromeUrl = undefined
            logger.warn('Not downloading binary.')
        }

        const sRelease: Release = selectedRelease
        const index = releases.findIndex(release => release.version === sRelease.version)

        switch (config.onFail) {
            case 'increase': {
                selectedRelease = releases[index - 1]

                if (selectedRelease) {
                    logger.info(`Continue with next ${config.inverse ? 'lower' : 'higher'} version "${selectedRelease.version.toString()}"`)
                } else {
                    return { chromeUrl: undefined, report, selectedRelease: undefined }
                }
                break
            }
            case 'decrease': {
                selectedRelease = releases[index + 1]

                if (selectedRelease) {

                    logger.info(`Continue with next ${config.inverse ? 'higher' : 'lower'} version "${selectedRelease.version.toString()}"`)
                } else {
                    return { chromeUrl: undefined, report, selectedRelease: undefined }
                }
                break
            }
            case 'nothing': {
                // TODO: pass notAvailableReleases to userSelectedVersion to disable non-available versions
                selectedRelease = await userSelectedVersion(releases, config, notAvailableVersions)
            }
        }
    } while (!chromeUrl || !config.download)

    return { chromeUrl, report, selectedRelease }
}

async function getChromeUrlForFull(config: IChromeFullConfig, osSetting: OSSetting, releases: Release[]): Promise<GetChromeDownloadUrlReturn> {

    const isAutoSearch = !config.interactive && config.onFail === 'decrease'

    const release = isAutoSearch
        ? releases[0]
        : await userSelectedVersion(releases, config, new Set())

    if (isAutoSearch && !!release) {
        logger.info(`Auto-searching with version ${release.version}`)
    }

    const { chromeUrl, report, selectedRelease } = await continueFetchingChromeUrl({
        config,
        osSetting,
        releases,
        selectedRelease: release,
    })

    return { chromeUrl, selectedRelease: selectedRelease, filenameOS: osSetting.filename, report }
}

async function getChromeUrlForSingle(config: IChromeSingleConfig, oSSetting: OSSetting, releases: Release[]): Promise<GetChromeDownloadUrlReturn> {
    const release = releases[0]
    const chromeUrl = release ? await fetchChromeUrlForVersion(oSSetting, release) : undefined

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

async function fetchChromeUrlForVersion(osSettings: IOSSettings, release: Release): Promise<string | undefined> {
    logger.debug(`fetching chrome url for version ${release.version} (${release.branchPosition})`)
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

