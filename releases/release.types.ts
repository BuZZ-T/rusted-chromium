import type { Channel, Platform } from '../interfaces/os.interfaces'
import { ComparableVersion } from '../public_api'

/**
 * Data returned from API call fetching releases
 */
export interface ApiRelease {
    channel: Channel
    chromium_main_branch_position: number
    hashes: Record<string, string>
    milestone: number
    platform: Platform
    previous_version: string
    time: number
    version: string
}

export interface Release {
    branchPosition: number
    version: ComparableVersion
}
