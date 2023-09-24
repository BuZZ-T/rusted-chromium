import { Compared } from '../interfaces/enums'
import type { IVersion } from '../interfaces/interfaces'
import { isIVersion } from '../utils/typeguards'

export class ComparableVersion implements IVersion {

    private _major: number
    private _minor: number
    private _branch: number
    private _patch: number

    public get major(): number {
        return this._major
    }

    public get minor(): number {
        return this._minor
    }

    public get branch(): number {
        return this._branch
    }

    public get patch(): number {
        return this._patch
    }

    public constructor(input: string)
    public constructor(major: number, minor: number, branch: number, patch: number)
    public constructor({ major, minor, branch, patch }: IVersion)
    public constructor(majorInput: number | string | IVersion, minor?: number, branch?: number, patch?: number) {
        if (isIVersion(majorInput)) {
            this._major = majorInput.major
            this._minor = majorInput.minor
            this._branch = majorInput.branch
            this._patch = majorInput.patch
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

    public toString(): string {
        return `${this.major}.${this.minor}.${this.branch}.${this.patch}`
    }

    /**
     * Compares two ComparableVersions with each other.
     * if version < other, the result is Compared.LESS
     * if version > other, the result is Compared.GREATER
     * if version === other, the result is Compared.EQUAL
     *
     * @param version
     * @param other
     */
    public static compare(version: ComparableVersion, other: ComparableVersion): Compared {
        if (version.major > other.major) { return Compared.GREATER }
        if (version.major < other.major) { return Compared.LESS }

        if (version.minor > other.minor) { return Compared.GREATER }
        if (version.minor < other.minor) { return Compared.LESS }

        if (version.branch > other.branch) { return Compared.GREATER }
        if (version.branch < other.branch) { return Compared.LESS }

        if (version.patch > other.patch) { return Compared.GREATER }
        if (version.patch < other.patch) { return Compared.LESS }

        return Compared.EQUAL
    }

    public static max(...versions: ComparableVersion[]): ComparableVersion {
        return versions.reduce((currentMax, version) => ComparableVersion.compare(currentMax, version) === Compared.LESS ? version : currentMax)
    }

    public static nextMajorVersion(version: ComparableVersion, plus = 1): ComparableVersion {
        return new ComparableVersion({
            major: version.major + plus,
            minor: 0,
            branch: 0,
            patch: 0,
        })
    }
}
