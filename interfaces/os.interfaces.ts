export type OS = 'win' | 'linux' | 'mac'
export type ExtendedOS = OS | 'darwin' | 'win32'
export type UrlOS = 'Linux_x64' | 'Linux' | 'Win_x64' | 'Win' | 'Mac' | 'Mac_Arm'

export type Arch = 'x64' | 'x86' | 'arm'

export interface IOSSettings {
    url: UrlOS
    filename: OS
}

export interface LinuxSetting extends IOSSettings {
    url: 'Linux_x64' | 'Linux'
    filename: 'linux'
}

export interface MacSetting extends IOSSettings {
    url: 'Mac_Arm' | 'Mac',
    filename: 'mac'
}

export interface WindowsSetting extends IOSSettings {
    url: 'Win' | 'Win_x64',
    filename: 'win'
}

export type OSSetting = LinuxSetting | WindowsSetting | MacSetting

export type Platform =
    | 'Android'
    | 'FuchsiaWebEngine'
    | 'Lacros'
    | 'Linux'
    | 'Mac'
    | 'Windows'
    | 'iOS'

/**
 * All possible channel. Be aware that not all platforms support all channels
 * @see {checkValidChannel}
 */
export type Channel = 'Canary' | 'Dev' | 'Beta' | 'Stable' | 'Extended'
