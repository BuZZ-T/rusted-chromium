import { LogConfig, LoggerConfig, TextFunction } from '../interfaces/interfaces'

export const LOAD_CONFIG: LoggerConfig = {
    start: 'Downloading local storage file',
    success: 'localstore.json file downloaded successfully!',
    fail: 'Error downloading localstore.json',
}

export const DOWNLOAD_ZIP: LogConfig<TextFunction, string> = {
    start: 'Downloading binary...',
    success: downloadPath => `Successfully downloaded to "${downloadPath}.zip"`,
    fail: 'Failed to download binary',
}

export const EXTRACT_ZIP: LogConfig<TextFunction, string> = {
    start: 'Downloading binary...',
    success: downloadPath => `Successfully downloaded and extracted to "${downloadPath}"`,
    fail: 'Failed to download binary',
}

export const READ_CONFIG: LogConfig<string, TextFunction> = {
    start: 'Reading local storage file from filesystem',
    success: 'Successfully loaded localstore.json from filesystem',
    fail: reason => `Error loading localstore.json from filesystem: ${reason}`,
}

export const RESOLVE_VERSION: LoggerConfig = {
    start: 'Resolving version to branch position...',
    success: 'Version resolved!',
    fail: 'Error resolving version!',
}

export const SEARCH_BINARY: LoggerConfig = {
    start: 'Searching for binary...',
    success: 'Binary found.',
    fail: 'No binary found!',
}
