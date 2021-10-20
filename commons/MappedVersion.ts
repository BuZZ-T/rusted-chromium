import { IVersionWithDisabled } from '../interfaces/interfaces'
import { isIVersionWithDisabled } from '../utils'
import { ComparableVersion } from './ComparableVersion'

export class MappedVersion {

    private _comparableVersion: ComparableVersion
    private _disabled: boolean

    public get comparable(): ComparableVersion {
        return this._comparableVersion
    }

    public get value(): string {
        return this._comparableVersion.toString()
    }

    public get disabled(): boolean {
        return this._disabled
    }

    public disable(): void {
        this._disabled = true
    }

    public constructor(input: string, disabled: boolean)
    public constructor(major: number, minor: number, branch: number, patch: number, disabled: boolean)
    public constructor(versionObject: IVersionWithDisabled)
    public constructor(majorObjectInput: number | string | IVersionWithDisabled, minorDisabled?: number | boolean, branch?: number, patch?: number, disabled?: boolean) {
        if (isIVersionWithDisabled(majorObjectInput)) {
            this._comparableVersion = new ComparableVersion(majorObjectInput)
            this._disabled = majorObjectInput.disabled
        }
        else if (typeof majorObjectInput === 'number' && typeof minorDisabled === 'number' && typeof branch === 'number' && typeof patch === 'number' && typeof disabled === 'boolean') {
            this._comparableVersion = new ComparableVersion(majorObjectInput, minorDisabled, branch, patch)
            this._disabled = disabled
        } else if (typeof majorObjectInput === 'string' && typeof minorDisabled === 'boolean') {
            this._comparableVersion = new ComparableVersion(majorObjectInput)
            this._disabled = minorDisabled
        } else {
            throw new Error('This should not happen, MappedVersion called with wrong types!')
        }
    }
}
