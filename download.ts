import { existsSync, mkdir as fsMkdir, createWriteStream, stat as fsStat, rmdir as fsRmdir, unlink as fsUnlink } from 'fs'
import { join as pathJoin } from 'path'
import { promisify } from 'util'

import { fetchChromeZipFile } from './api'
import { DEFAULT_FULL_CONFIG, DEFAULT_SINGLE_CONFIG } from './commons/constants'
import { DOWNLOAD_ZIP, EXTRACT_ZIP } from './commons/loggerTexts'
import { NoChromiumDownloadError } from './errors'
import type { DownloadReportEntry, IChromeConfig } from './interfaces/interfaces'
import { DebugMode, logger } from './log/logger'
import { progress } from './log/progress'
import { spinner } from './log/spinner'
import { loadStore } from './store/loadStore'
import { isChromeSingleConfig } from './utils/typeguards'
import { getChromeDownloadUrl, loadVersions, mapVersions } from './versions'

/* eslint-disable @typescript-eslint/no-var-requires */
const extract = require('extract-zip')
const Progress = require('node-fetch-progress')
/* eslint-enable @typescript-eslint/no-var-requires */

const mkdir = promisify(fsMkdir)
const stat = promisify(fsStat)
const rmdir = promisify(fsRmdir)
const unlink = promisify(fsUnlink)

function registerSigIntHandler(path: string): void {
    process.on('SIGINT', () => {
        return stat(path)
            .then(stats => {
                if (stats.isDirectory()) {
                    return rmdir(path, { recursive: true })
                } else if (stats.isFile()) {
                    return unlink(path)
                } else {
                    return
                }
            })
            .finally(() => {
                process.exit(130)
            })
    })
}

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
        await extract(`${downloadPath}.zip`, { dir: pathJoin(__dirname, downloadPath), onEntry: function(file: {fileName: string}) {
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
    if(config.debug) {
        logger.setDebugMode(DebugMode.DEBUG)
    }

    const versions = await loadVersions()
    const store = await loadStore()

    const mappedVersions = mapVersions(versions, config, store)

    logger.debug(`total number of versions: ${versions.length}, filtered versions: ${mappedVersions.length}`)

    const { chromeUrl, filenameOS, report, selectedVersion } = await getChromeDownloadUrl(config, mappedVersions)

    if (chromeUrl && selectedVersion && config.download) {
        const filename = `chrome-${filenameOS}-${config.arch}-${selectedVersion.value}`
        const downloadPath = config.downloadFolder
            ? pathJoin(config.downloadFolder, filename)
            : filename

        if (!!config.downloadFolder && !existsSync(config.downloadFolder)) {
            await mkdir(config.downloadFolder, { recursive: true })
            logger.info(`${config.downloadFolder} created'`)
        }

        const zipFileResponse = await fetchChromeZipFile(chromeUrl)

        let isFirstProgress = true

        new Progress(zipFileResponse, { throttle: 100 }).on('progress', (p: { progress: number, total: number }) => {
            if (isFirstProgress) {
                progress.start({
                    barLength: 40,
                    steps: Math.round(p.total / 1024 / 1024),
                    unit: 'MB',
                    showNumeric: true,
                    start: DOWNLOAD_ZIP.start,
                    success: DOWNLOAD_ZIP.success(downloadPath),
                    fail: DOWNLOAD_ZIP.fail,
                })
                isFirstProgress = false
            } else {
                progress.fraction(p.progress)
            }
        })

        const filenameWithExtension = downloadPath + '.zip'
        const file = createWriteStream(filenameWithExtension)
        registerSigIntHandler(filenameWithExtension)
        zipFileResponse.body.pipe(file)

        return new Promise((resolve, reject) => {
            zipFileResponse.body.on('end', async () => {
                if (config.autoUnzip) {
                    await extractZip(downloadPath)
                }
                resolve(report)
            })

            zipFileResponse.body.on('error', () => {
                reject()
            })
        })
    }

    if (!chromeUrl && config.download && config.single) {
        throw new NoChromiumDownloadError()
    }

    return report
}

/**
 * Downlodas a chromium zip file with default config, which can be partially overridden 
 * @param config IChromeConfig to override the default config. May omit fields and can be ommited entirely
 * @returns 
 */
const withDefaults = (config: Partial<IChromeConfig> = {}) => downloadForConfig(enrichAdditionalConfig(config))

/**
 * Downloads a chromium zip file based on the given config
 * @see DEFAULT_FULL_CONFIG
 * @see DEFAULT_SINGLE_CONFIG
 * @param additionalConfig Manually set config, which will override the settings in the default config
 */
export const downloadChromium = Object.assign(
    downloadForConfig,
    { withDefaults }
)
