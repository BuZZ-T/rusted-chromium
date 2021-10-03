import type { MappedVersion } from '../commons/MappedVersion'
import type { Nullable } from './interfaces'

export interface ContinueFetchingChromeUrlReturn {
    chromeUrl: Nullable<string>
    selectedVersion: Nullable<MappedVersion>
}

export interface GetChromeDownloadUrlReturn {
    chromeUrl: Nullable<string>
    selectedVersion: Nullable<MappedVersion>
    filenameOS: string
}
