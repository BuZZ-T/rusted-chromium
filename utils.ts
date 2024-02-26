import type { IChromeConfig } from './interfaces/interfaces'
import type { OSSetting, OS, ExtendedOS } from './interfaces/os.interfaces'

export function detectOperatingSystem(config: IChromeConfig): OSSetting {

    const is64Bit = config.arch === 'x64'

    switch (config.os) {
        case 'linux':
            return is64Bit
                ? {
                    url: 'Linux_x64',
                    filename: 'linux'
                }
                : {
                    url: 'Linux',
                    filename: 'linux'
                }
        case 'win':
            return is64Bit
                ? {
                    url: 'Win_x64',
                    filename: 'win'
                }
                : {
                    url: 'Win',
                    filename: 'win'
                }
        case 'mac':
            return config.arch === 'arm'
                ? {
                    url: 'Mac_Arm',
                    filename: 'mac'
                }
                : {
                    url: 'Mac',
                    filename: 'mac'
                }
        default:
            throw new Error(`Unsupported operation system: ${config.os}`)
    }
}

export function mapOS(extendedOS: string): OS {
    switch (extendedOS as ExtendedOS) {
        case 'linux':
            return 'linux'
        case 'win32':
        case 'win':
            return 'win'
        case 'darwin':
        case 'mac':
            return 'mac'
    }

    throw new Error(`unknown OS: ${extendedOS}`)
}

export function* popArray<T>(array: T[]): Generator<T, void, void> {
    for(const element of array) {
        yield element
    }
}
