export type OS = 'win' | 'linux' | 'mac'
export type ExtendedOS = OS | 'darwin' | 'win32'
export type UrlOS = 'Linux_x64' | 'Linux' | 'Win_x64' | 'Win' | 'Mac'

export interface IOSSettings {
    url: UrlOS
    filename: OS
}

export interface LinuxSetting extends IOSSettings {
    url: 'Linux_x64' | 'Linux'
    filename: 'linux'
}

export interface MacSetting extends IOSSettings {
    url: 'Mac',
    filename: 'mac'
}

export interface WindowsSetting extends IOSSettings {
    url: 'Win' | 'Win_x64',
    filename: 'win'
}

export type OSSetting = LinuxSetting | WindowsSetting | MacSetting
