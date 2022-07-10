
/* eslint-disable-next-line import/no-namespace */
import * as program from 'commander'

import { ComparableVersion } from '../commons/ComparableVersion'
import { DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import type { IConfigOptions } from '../interfaces/config.interfaces'
import type { ConfigWrapper, IChromeSingleConfig } from '../interfaces/interfaces'
import { logger } from '../log/logger'
/* eslint-disable-next-line import/no-namespace */
import * as packageJson from '../package.json'
import { mapOS } from '../utils'

/**
 * Checks the arguments passed to the programm and returns them
 */
export function readConfig(args: string[], platform: NodeJS.Platform): ConfigWrapper {
    program
        .version(packageJson.version)
        .option('-m, --min <version>', 'The minimum version', DEFAULT_CONFIG_OPTIONS.min)
        .option('-M, --max <version>', 'The maximum version. Newest version if not specificied', DEFAULT_CONFIG_OPTIONS.max)
        .option('-r, --max-results <results>', 'The maximum amount of results to choose from', null)
        .option('-o, --os <os>', 'The operating system for what the binary should be downloaded')
        .option('-a, --arch <arch>', 'The architecture for what the binary should be downloaded. Valid values are "x86" and "x64". Only works when --os is also set')
        .option('-d, --decrease-on-fail', 'If a binary does not exist, go to the next lower version number and try again (regarding --min, --max and --max-results)', false)
        .option('-i, --increase-on-fail', 'If a binary does not exist, go to the next higher version number and try again (regarding --min, --max and --max-results), overwrites "--decrease-on-fail" if both set', false)
        .option('-z, --unzip', 'Directly unzip the downloaded zip-file and delete the .zip afterwards', DEFAULT_CONFIG_OPTIONS.unzip)
        .option('-n, --non-interactive', 'Don\'t show the selection menu. Automatically select the newest version. Only works when --decrease-on-fail is also set.', false)
        .option('-t, --no-store', 'Don\'t store negative hits in the local store file.', DEFAULT_CONFIG_OPTIONS.store)
        .option('-l, --no-download', 'Don\'t download the binary. It also continues with the next version, if --decrease-on-fail or --increase-on-fail is set. Useful to build up the negative hit store', DEFAULT_CONFIG_OPTIONS.download)
        .option('-I, --import-store <url>', 'Imports a localstore.json file either by URL (starting with "http://" or "https://" or by local file')
        .option('-E, --export-store [path]', 'Exports the localstore.json file to stdout')
        .option('-H, --hide-negative-hits', 'Hide negative hits', DEFAULT_CONFIG_OPTIONS.hideNegativeHits)
        .option('-f, --folder <folder>', 'Set the download folder', null)
        .option('-O, --only-newest-major', 'Show only the newest major version in user selection', DEFAULT_CONFIG_OPTIONS.onlyNewestMajor)
        .option('-v, --inverse', 'Sort the selectable versions ascending', DEFAULT_CONFIG_OPTIONS.inverse)
        .option('-s, --single <version>', 'Download a specific version in non-interactive mode, even if the file is listed in the localstore.json. Several other flags have no effect.')
        .option('--list', 'List versions matching the criteria, doing nothing more', DEFAULT_CONFIG_OPTIONS.list)
        .option('-q, --quiet', 'Suppress any logging output', DEFAULT_CONFIG_OPTIONS.quiet)
        .option('--debug', 'Activates the debug mode (extended logging)', DEFAULT_CONFIG_OPTIONS.debug)
        .parse(args)

    const options = program.opts() as IConfigOptions

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
    const arch = is64Bit ? 'x64' : 'x86'

    if (options.importStore) {
        return {
            action: 'importStore',
            config: {
                url: options.importStore,
                quiet: options.quiet,
                debug: options.debug,
            },
        }
    }

    if (options.exportStore !== undefined) {
        return {
            action: 'exportStore',
            config: {
                path: typeof options.exportStore === 'string' ? options.exportStore : undefined,
                quiet: options.quiet,
                debug: options.debug,
            }
        }
    }

    if (options.single) {
        const config: IChromeSingleConfig = {
            arch,
            os,
            autoUnzip: options.unzip,
            store: options.store,
            download: options.download,
            downloadFolder: options.folder || null,
            single: new ComparableVersion(options.single),
            quiet: options.quiet,
            debug: options.debug,
        }

        return {
            action: 'loadChrome',
            config,
        }
    }

    return {
        action: 'loadChrome',
        config: {
            arch,
            autoUnzip: options.unzip,
            debug: options.debug,
            download: options.download,
            downloadFolder: options.folder || null,
            hideNegativeHits: options.hideNegativeHits,
            interactive: !options.nonInteractive,
            inverse: options.inverse,
            list: options.list,
            max: new ComparableVersion(options.max),
            min: new ComparableVersion(options.min),
            onFail: options.increaseOnFail ? 'increase' : options.decreaseOnFail ? 'decrease' : 'nothing',
            onlyNewestMajor: options.onlyNewestMajor,
            os,
            quiet: options.quiet,
            results: minIsSet && !maxResultsIsSet ? Infinity : (parseInt(options.maxResults as string, 10) || 10),
            single: null,
            store: options.store,
        },
    }
}
