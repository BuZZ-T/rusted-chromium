import { createWriteStream } from 'node:fs'
import { mkdir, stat, rmdir, unlink } from 'node:fs/promises'
import { join as pathJoin } from 'node:path'
import { logger, progress, spinner } from 'yalpt'

import { FluentDownload } from './download-fluent'
import { FluentDownloadSingleIncomplete } from './download-fluent-single'
import { fetchChromeZipFile } from '../api'
import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG } from '../commons/constants'
import { DOWNLOAD_ZIP, EXTRACT_ZIP } from '../commons/loggerTexts'
import { NoChromiumDownloadError } from '../errors'
import type { DownloadReportEntry, IChromeConfig } from '../interfaces/interfaces'
import { applyConfigToLoggers } from '../log/logger.utils'
import { loadReleases, mapApiReleasesToReleases } from '../releases/releases'
import { existsAndIsFolder } from '../utils/file.utils'
import { isChromeSingleConfig } from '../utils/typeguards'
import { getChromeDownloadUrl } from '../versions'

/* eslint-disable @typescript-eslint/no-require-imports */
const extract = require('extract-zip')
const Progress = require('node-fetch-progress')
/* eslint-enable @typescript-eslint/no-require-imports */

function registerSigIntHandler(path: string): void {
    process.on('SIGINT', async () => {
        try {
            const stats = await stat(path)

            if (stats.isDirectory()) {
                return rmdir(path, { recursive: true })
            } else if (stats.isFile()) {
                return unlink(path)
            } else {
                return
            }

        } finally {
            logger.warn('Download aborted')
            process.exit(130)
        }
    })
}

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & unknown;

function enrichAdditionalConfig(additionalConfig: Partial<IChromeConfig> = {}): IChromeConfig {
    if (isChromeSingleConfig(additionalConfig)) {
        return {
            ...DEFAULT_SINGLE_CONFIG,
            ...additionalConfig,
        }
    } else {
        return {
            ...DEFAULT_FULL_CONFIG,
            ...additionalConfig,
        }
    }
}

async function extractZip(downloadPath: string) {
    try {
        spinner.start(EXTRACT_ZIP)
        await extract(`${downloadPath}.zip`, { dir: pathJoin(process.cwd(), downloadPath), onEntry: function(file: {fileName: string}) {
            spinner.update(`Extracting: ${file.fileName}`)
        } })
        spinner.success(downloadPath)
        unlink(`${downloadPath}.zip`).catch(err => {
            logger.error(`Error removing zip file after extracting: ${err.toString()}`)
        })
    } catch (err) {
        spinner.error((err as Error).toString())
    }
}

/**
 * Downloads a chromium zip file based on the given config
 * @see DEFAULT_FULL_CONFIG
 * @see DEFAULT_SINGLE_CONFIG
 * @param additionalConfig Manually set config, which will override the settings in the default config
 */
async function downloadForConfig(config: IChromeConfig): Promise<DownloadReportEntry[]> {
    applyConfigToLoggers({config, logger, progress, spinner})

    const apiReleases = await loadReleases(config.os, config.channel)

    const mappedReleases = mapApiReleasesToReleases(apiReleases, config)

    if (!isChromeSingleConfig(config) && config.list) {
        logger.info('versions:')
        mappedReleases.forEach(r => {
            logger.info(r.version.toString())
        })
        return []
    }

    logger.debug(`total number of versions: ${mappedReleases.length}, filtered versions: ${mappedReleases.length}`)

    const { chromeUrl, filenameOS, report, selectedRelease: release } = await getChromeDownloadUrl(config, mappedReleases)

    if (!chromeUrl && config.download && config.single) {
        throw new NoChromiumDownloadError()
    }

    if (!chromeUrl || !release || !config.download) {
        return report
    }

    const filename = `chrome-${filenameOS}-${config.arch}-${release.version.toString()}`
    const downloadPath = config.downloadFolder
        ? pathJoin(config.downloadFolder, filename)
        : filename

    if (!!config.downloadFolder && !(await existsAndIsFolder(config.downloadFolder))) {
        await mkdir(config.downloadFolder, { recursive: true })
        logger.info(`${config.downloadFolder} created'`)
    }

    logger.debug(`Downloading version: ${release.version.toString()}`)
    const zipFileResponse = await fetchChromeZipFile(chromeUrl)

    let isFirstProgress = true

    new Progress(zipFileResponse, { throttle: 100 }).on('progress', (p: { progress: number, total: number }) => {
        if (isFirstProgress) {
            progress.start({
                barLength: 40,
                fail: DOWNLOAD_ZIP.fail,
                showNumeric: true,
                start: DOWNLOAD_ZIP.start,
                steps: Math.round(p.total / 1024 / 1024),
                success: DOWNLOAD_ZIP.success(downloadPath),
                unit: 'MB',
            })
            isFirstProgress = false
        } else {
            progress.fraction(p.progress)
        }
    })

    const filenameWithExtension = downloadPath + '.zip'
    const file = createWriteStream(filenameWithExtension)
    registerSigIntHandler(filenameWithExtension)

    logger.debug(`Writing downloaded ZIP to file ${filenameWithExtension}`)

    zipFileResponse.body?.pipe(file)

    return new Promise((resolve, reject) => {
        zipFileResponse.body?.on('end', async () => {
            if (config.autoUnzip) {
                await extractZip(downloadPath)
            }
            resolve(report)
        })

        zipFileResponse.body?.on('error', () => {
            reject()
        })
    })
}

const fluent = new FluentDownload()
const fluentSingle = new FluentDownloadSingleIncomplete()

/**
 * Downloads a chromium zip file based on the given config
 */

export const downloadChromium = Object.assign(
    downloadForConfig,
    {
        /**
         * Allows to setup the configuration for downloading rusted-chromium via a fluent interface.
         * If a value is not set, it defaults to "false".
         * Complete the configuration and start executing with ".start()"
         */
        with: fluent,
        withSingle: fluentSingle,
        /**
         * Downloads a chromium zip file with default config, which can be partially overridden
         * @param config IChromeConfig to override the default config. May omit fields and can be ommited entirely
         */
        withDefaults: (config: Partial<IChromeConfig> = {}) => downloadForConfig(enrichAdditionalConfig(config)),
    }
)
