import { ExtendedOS, OS, IChromeConfig } from './interfaces'
import { logger } from './loggerSpinner'

export function detectOperatingSystem(config: IChromeConfig): [string, string] {

    const archForUrl = config.arch === 'x64' ? '_x64' : ''

    switch(config.os) {
        case 'linux':
            return [`Linux${archForUrl}`, 'linux']
        case 'win':
            return [`Win${archForUrl}`, 'win']
        case 'mac':
            if (config.arch === 'x86') {
                logger.warn('A mac version is not available for "x86" architecture, using "x64"!')
                config.arch = 'x64'
            }
            return ['Mac', 'mac']
        default:
            throw new Error(`Unsupported operation system: ${config.os}`)
    }
}

/**
 * Pads each version part except major (so minor, branch and patch) with at least one digit more as now necessary
 * so versions can be compared just by < and <= as strings
 * E.g. "79.0.3945.10" will become "7900039450010"
 */
export function versionToComparableVersion(version: string): number {
    const splitVersion = version.split('.')
    const paddedSplitVersion = splitVersion.concat(Array(4 - splitVersion.length).fill('0'))

    return parseInt(paddedSplitVersion[0]
         + paddedSplitVersion[1].padStart(2, '0')
         + paddedSplitVersion[2].padStart(5, '0')
         + paddedSplitVersion[3].padStart(4, '0'), 10)
}

export function mapOS(extendedOS: ExtendedOS): OS {
    switch(extendedOS) {
        case 'linux':
            return 'linux'
        case 'win32':
        case 'win':
            return 'win'
        case 'darwin':
        case 'mac':
            return 'mac'
    }
}
