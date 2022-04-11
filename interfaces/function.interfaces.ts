import type { MappedVersion } from '../commons/MappedVersion'
import type { DownloadReportEntry, IChromeFullConfig, Nullable } from './interfaces'
import { OSSetting } from './os.interfaces'

export interface ContinueFetchingChromeUrlReturn {
    chromeUrl: Nullable<string>
    report: DownloadReportEntry[]
    selectedVersion: Nullable<MappedVersion>
}

export interface GetChromeDownloadUrlReturn {
    chromeUrl: Nullable<string>
    selectedVersion: Nullable<MappedVersion>
    filenameOS: string
    report: DownloadReportEntry[]
}

export interface ContinueFetchingChromeUrlParams {
    config: IChromeFullConfig
    mappedVersions: MappedVersion[]
    osSetting: OSSetting
    version: Nullable<MappedVersion>
}
