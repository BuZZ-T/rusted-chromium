import { fetchLocalStore } from '../api'
import { LOAD_CONFIG } from '../commons/loggerTexts'
import type { IStoreConfig } from '../interfaces/interfaces'
import { spinner } from '../log/spinner'
import { Store } from './Store'

/**
 * Downloads the localstore.json file an places it in the work directory of rusted chromium.
 * Adds "localstore.json" to the URL if it's not present
 * @param url
 */
export async function downloadStore(config: IStoreConfig, destinationPath: string): Promise<Store> {
    let url = config.url

    if (!url.endsWith(destinationPath)) {
        if (!url.endsWith('/')) {
            url += '/'
        }
        url = `${url}${destinationPath}`
    }

    spinner.start(LOAD_CONFIG)

    return fetchLocalStore(url).then(storeFile => {
        spinner.success()
        return new Store(storeFile)
    }).catch(err => {
        spinner.error()
        if (err?.message && err.path) {
            spinner.error(`${err.message}: ${err.path}`)
        } else {
            spinner.error(err)
        }

        throw err
    })
}
