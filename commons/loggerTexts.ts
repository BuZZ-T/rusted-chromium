import { LoggerConfig, StringLoggerConfig, TextFunction } from '../interfaces/interfaces'

export const LOAD_CONFIG: StringLoggerConfig = {
    start: 'Downloading local storage file',
    success: 'localstore.json file downloaded successfully!',
    fail: 'Error downloading localstore.json',
}

export const DOWNLOAD_ZIP: LoggerConfig<TextFunction, string> = {
    start: 'Downloading binary...',
    success: downloadPath => `Successfully downloaded to "${downloadPath}.zip"`,
    fail: 'Failed to download binary',
}

export const EXTRACT_ZIP: LoggerConfig<TextFunction, TextFunction> = {
    start: 'Extracting binary...',
    success: downloadPath => `Successfully extracted to "${downloadPath}"`,
    fail: error => `Failed to extract binary ${error}`,
}

export const DELETE_ZIP: StringLoggerConfig = {
    start: 'Deleting zip...',
    success: 'Successfully deleted zip file',
    fail: 'Failed to delete zip file',
}

export const READ_CONFIG: LoggerConfig<string, TextFunction> = {
    start: 'Reading local storage file from filesystem',
    success: 'Successfully loaded localstore.json from filesystem',
    fail: reason => `Error loading localstore.json from filesystem: ${reason}`,
}

export const SEARCH_BINARY: StringLoggerConfig = {
    start: 'Searching for binary...',
    success: 'Binary found.',
    fail: 'No binary found!',
}
