import { createWriteStream, existsSync, mkdir as fsMkdir } from 'fs'
import { parse } from 'node-html-parser'
import { promisify } from 'util'
import * as unzipper from 'unzipper'
import * as path from 'path'

import { fetchChromiumTags, fetchChromeZipFile } from './api'
import { IChromeConfig, IStoreConfig } from './interfaces'
import { logger } from './loggerSpinner'
import { getChromeDownloadUrl, mapVersions } from './versions'
import { importAndMergeLocalstore } from './store/importStore'
import { loadStore } from './store/store'
import { readConfig } from './config/config'

const mkdir = promisify(fsMkdir)

/**
 * Parses the chromium tags and returns all chromium versions
 */
async function loadVersions(): Promise<string[]> {
    const tags = await fetchChromiumTags()

    const parsedTags = parse(tags) as unknown as (HTMLElement & { valid: boolean })

    const h3s = parsedTags.querySelectorAll('h3')

    let tagsHeadline: any
    h3s.forEach((h3: any) => {
        if (h3.text === 'Tags') {
            tagsHeadline = h3
        }
    })

    if (!tagsHeadline) {
        throw new Error('Tags headline not found in HTML')
    }

    const tagsList = tagsHeadline.parentNode.childNodes[1]

    if (!tagsList) {
        throw new Error('No list of tags found under tags headline')
    }

    const versions: string[] = []
    tagsList.childNodes.forEach((tag: any) => {
        versions.push(tag.text)
    })

    return versions
}

async function main(): Promise<void> {
    const configWrapper = readConfig(process.argv, process.platform)

    if (configWrapper.action === 'importStore') {
        const config: IStoreConfig = configWrapper.config
        await importAndMergeLocalstore(config)
    } else if (configWrapper.action === 'loadChrome') {
        const config: IChromeConfig = configWrapper.config
        await downloadChromium(config)
    } else {
        logger.error(`Failed to read config: ${configWrapper}`)
    }
}

async function downloadChromium(config: IChromeConfig): Promise<void> {
    const versions = await loadVersions()
    const store = await loadStore()
    const storeByOs = new Set(store[config.os][config.arch])
    const mappedVersions = mapVersions(versions, config, storeByOs)

    const [chromeUrl, selectedVersion, filenameOS] = await getChromeDownloadUrl(config, mappedVersions)

    if (chromeUrl && config.download) {
        logger.success()
        const filename = `chrome-${filenameOS}-${config.arch}-${selectedVersion}`
        const downloadPath = config.downloadFolder
            ? path.join(config.downloadFolder, filename)
            : filename

        if (!!config.downloadFolder && !existsSync(config.downloadFolder)) {
            await mkdir(config.downloadFolder, { recursive: true })
            console.log(config.downloadFolder, ' created')
        }

        logger.start({
            start: 'Downloading binary...',
            success: config.autoUnzip ? `Successfully downloaded and extracted to ${downloadPath}/` : `${downloadPath}.zip successfully downloaded`,
            fail: 'Failed to download binary',
        })

        await fetchChromeZipFile(chromeUrl).then(res => {
            if (config.autoUnzip) {
                res.body.pipe(
                    unzipper.Extract({ path: downloadPath })
                )
                    .on('close', () => {
                        logger.success()
                    })
            } else {
                const file = createWriteStream(downloadPath + '.zip')
                res.body.pipe(file)
                file.on('close', () => {
                    logger.success()
                })
            }
        })
    }

    // quit with exit code, if one single version is specified, but no binary is found
    if (!chromeUrl && config.download && config.single) {
        process.exit(1)
    }
}

main().catch(error => {
    console.error(error)
})
