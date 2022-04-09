import type { IChromeConfig, IChromeSingleConfig, IVersionWithDisabled, IVersion, TextFunction } from '../interfaces/interfaces'

export function isTextFunction(value: string | TextFunction | undefined): value is TextFunction {
    return typeof value === 'function'
}

export function isIVersion(value: unknown): value is IVersion {
    return typeof (value as IVersion).major === 'number'
        && typeof (value as IVersion).minor === 'number'
        && typeof (value as IVersion).branch === 'number'
        && typeof (value as IVersion).patch === 'number'
}

export function isIVersionWithDisabled(value: unknown): value is IVersionWithDisabled {
    return isIVersion(value) && typeof (value as IVersionWithDisabled).disabled === 'boolean'
}

export function isChromeSingleConfig(value: Partial<IChromeConfig>): value is Partial<IChromeSingleConfig> {
    return value.single !== null && value.single !== undefined
}
