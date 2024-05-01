import type { DownloadReportEntry, IChromeFullConfig, Nullable } from './interfaces'
import type { OSSetting } from './os.interfaces'
import type { Release } from '../releases/release.types'

export interface ContinueFetchingChromeUrlReturn {
    chromeUrl: Nullable<string>
    report: DownloadReportEntry[]
    selectedRelease: Nullable<Release>
}

export interface GetChromeDownloadUrlReturn {
    chromeUrl: Nullable<string>
    filenameOS: string
    report: DownloadReportEntry[]
    selectedRelease: Nullable<Release>
}

export interface ContinueFetchingChromeUrlParams {
    config: IChromeFullConfig
    osSetting: OSSetting
    releases: Release[]
    selectedRelease: Nullable<Release>
}
