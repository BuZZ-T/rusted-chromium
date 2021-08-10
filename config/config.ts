
import * as program from 'commander'

import { ConfigWrapper } from '../interfaces'

import * as packageJson from '../package.json'
import { mapOS } from '../utils'
import { logger } from '../loggerSpinner'
import { IConfigOptions } from './config.interfaces'
import { ComparableVersion } from '../commons/ComparableVersion'

export const DEFAULT_OPTIONS: IConfigOptions = {
    min: '0',
    max: '10000',

    nonInteractive: false,
    hideNegativeHits: false,
    onlyNewestMajor: false,
    inverse: false,
    store: true,
    download: true,
    increaseOnFail: false,
    decreaseOnFail: false,
    unzip: false,
}

/**
 * Checks the arguments passed to the programm and returns them
 */
export function readConfig(args: string[], platform: NodeJS.Platform): ConfigWrapper {
    program
        .version(packageJson.version)
        .option('-m, --min <version>', 'The minimum version', DEFAULT_OPTIONS.min)
        .option('-M, --max <version>', 'The maximum version. Newest version if not specificied', DEFAULT_OPTIONS.max)
        .option('-r, --max-results <results>', 'The maximum amount of results to choose from')
        .option('-o, --os <os>', 'The operating system for what the binary should be downloaded')
        .option('-a, --arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .option('-d, --decrease-on-fail', 'If a binary does not exist, go to the next lower version number and try again (regarding --min, --max and --max-results)', false)
        .option('-i, --increase-on-fail', 'If a binary does not exist, go to the next higher version number and try again (regarding --min, --max and --max-results), overwrites "--decrease-on-fail" if both set', false)
        .option('-z, --unzip', 'Directly unzip the downloaded zip-file and delete the .zip afterwards', false)
        .option('-n, --non-interactive', 'Don\'t show the selection menu. Automatically select the newest version. Only works when --decrease-on-fail is also set.', false)
        .option('-t, --no-store', 'Don\'t store negative hits in the local store file.', DEFAULT_OPTIONS.store)
        .option('-l, --no-download', 'Don\'t download the binary. It also continues with the next version, if --decrease-on-fail or --increase-on-fail is set. Useful to build up the negative hit store', DEFAULT_OPTIONS.download)
        .option('-I --import-store <url>', 'Imports a localstore.json file either by URL (starting with "http://" or "https://" or by local file')
        .option('-H, --hide-negative-hits', 'Hide negative hits', DEFAULT_OPTIONS.hideNegativeHits)
        .option('-f, --folder <folder>', 'Set the download folder', null)
        .option('-O, --only-newest-major', 'Show only the newest major version in user selection', DEFAULT_OPTIONS.onlyNewestMajor)
        .option('-v, --inverse', 'Sort the selectable versions ascending', DEFAULT_OPTIONS.inverse)
        .option('-s, --single <version>', 'Download a specific version in non-interactive mode, even if the file is listed in the localstore.json. Several other flags have no effect.')
        .parse(args)

    const options = program.opts() as IConfigOptions

    const min = new ComparableVersion(options.min)
    const max = new ComparableVersion(options.max)

    const minIsSet = +options.min > 0
    const maxResultsIsSet = !!options.maxResults

    const os = mapOS(options.os || platform)

    if (!options.os && options.arch) {
        logger.warn('Setting "--arch" has no effect, when "--os" is not set!')
    }
    if (options.nonInteractive && !options.decreaseOnFail) {
        logger.warn('Setting "--non-interactive" has no effect, when "--decrease-on-fail" is not set!')
    }

    const is64Bit = (options.os && options.arch) ? options.arch === 'x64' : true

    if (options.importStore) {
        return {
            action: 'importStore',
            config: {
                url: options.importStore,
            },
        }
    }

    return {
        action: 'loadChrome',
        config: {
            autoUnzip: options.unzip,
            min,
            max,
            results: minIsSet && !maxResultsIsSet ? Infinity : (parseInt(options.maxResults as string, 10) || 10),
            os,
            arch: is64Bit ? 'x64' : 'x86',
            onFail: options.increaseOnFail ? 'increase' : options.decreaseOnFail ? 'decrease' : 'nothing',
            interactive: !options.nonInteractive,
            store: options.store,
            download: options.download,
            hideNegativeHits: options.hideNegativeHits,
            downloadFolder: options.folder || null,
            onlyNewestMajor: options.onlyNewestMajor,
            single: options.single || null,
            inverse: options.inverse,
        },
    }
}
