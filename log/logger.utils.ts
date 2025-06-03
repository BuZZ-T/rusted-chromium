import { DebugMode } from 'yalpt'
import type { Logger, ProgressBar, Spinner } from 'yalpt'

import type { IChromeCoreConfig } from '../interfaces/interfaces'

export function applyConfigToLoggers({
    config,
    logger,
    spinner,
    progress,
}: {
    config: IChromeCoreConfig,
    logger: Logger,
    spinner: Spinner,
    progress: ProgressBar,
}): void {
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
