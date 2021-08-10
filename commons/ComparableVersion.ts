export class ComparableVersion {

    private _major: number
    private _minor: number
    private _branch: number
    private _patch: number

    public get major() {
        return this._major
    }

    public get minor() {
        return this._minor
    }

    public get branch() {
        return this._branch
    }

    public get patch() {
        return this._patch
    }

    public constructor(input: string)
    public constructor(major: number, minor: number, branch: number, patch: number)
    public constructor({ major, minor, branch, patch }: { major: number, minor: number, branch: number, patch: number })
    public constructor(majorInput: number | string | { major: number, minor: number, branch: number, patch: number }, minor?: number, branch?: number, patch?: number) {
        if (typeof majorInput === 'object') {
            this._major = majorInput.major
            this._minor = majorInput.minor || 0
            this._branch = majorInput.branch || 0
            this._patch = majorInput.patch || 0
        } else if (typeof majorInput === 'number') {
            this._major = majorInput
            this._minor = minor || 0
            this._branch = branch || 0
            this._patch = patch || 0
        } else {
            const splitVersion = majorInput.split('.')

            this._major = parseInt(splitVersion[0], 10) || 0
            this._minor = parseInt(splitVersion[1], 10) || 0
            this._branch = parseInt(splitVersion[2], 10) || 0
            this._patch = parseInt(splitVersion[3], 10) || 0
        }
    }

    public toString() {
        return `${this.major}.${this.minor}.${this.branch}.${this.patch}`
    }
}
