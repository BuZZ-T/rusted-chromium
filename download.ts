import { existsSync, mkdir as fsMkdir, createWriteStream, stat as fsStat, rmdir as fsRmdir, unlink as fsUnlink } from 'fs'
import * as path from 'path'
import * as unzipper from 'unzipper'
import { promisify } from 'util'

import { fetchChromeZipFile } from './api'
import { NoChromiumDownloadError } from './errors'
import { IChromeConfig } from './interfaces'
import { progress } from './log/progress'
import { logger } from './log/spinner'
import { loadStore } from './store/store'
import { getChromeDownloadUrl, loadVersions, mapVersions } from './versions'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const Progress = require('node-fetch-progress')

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

export async function downloadChromium(config: IChromeConfig): Promise<void> {
    const versions = await loadVersions()
    const store = await loadStore()
    const storeByOs = new Set(store[config.os][config.arch])
    const mappedVersions = mapVersions(versions, config, storeByOs)

    const { chromeUrl, selectedVersion, filenameOS } = await getChromeDownloadUrl(config, mappedVersions)

    if (chromeUrl && config.download) {
        const filename = `chrome-${filenameOS}-${config.arch}-${selectedVersion}`
        const downloadPath = config.downloadFolder
            ? path.join(config.downloadFolder, filename)
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
                    start: 'Downloading binary...',
                    success: `Successfully downloaded ${config.autoUnzip ? 'and extracted ' : ''}to "${downloadPath}${config.autoUnzip ? '' : '.zip'}"`,
                    fail: 'Failed to download binary',
                })
                isFirstProgress = false
            } else {
                progress.fraction(p.progress)
            }
        })

        if (config.autoUnzip) {
            registerSigIntHandler(downloadPath)
            zipFileResponse.body.pipe(
                unzipper.Extract({ path: downloadPath })
            )
        } else {
            const filename = downloadPath + '.zip'
            const file = createWriteStream(downloadPath + '.zip')
            registerSigIntHandler(filename)
            zipFileResponse.body.pipe(file)
        }
    }

    if (!chromeUrl && config.download && config.single) {
        throw new NoChromiumDownloadError()
    }
}
