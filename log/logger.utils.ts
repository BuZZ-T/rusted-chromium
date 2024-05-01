import { DebugMode, logger } from './logger'
import { progress } from './progress'
import { spinner } from './spinner'
import type { IChromeCoreConfig } from '../interfaces/interfaces'

export function applyConfigToLoggers(config: IChromeCoreConfig): void {
    if (config.debug) {
        logger.setDebugMode(DebugMode.DEBUG)
    }

    if (config.quiet) {
        logger.silent()
        progress.silent()
        spinner.silent()
    }

    if (!config.progress) {
        logger.noProgress()
        progress.noProgress()
        spinner.noProgress()
    }

    if (!config.color) {
        logger.noColor()
        progress.noColor()
        spinner.noColor()
    }
}
