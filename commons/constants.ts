import { LoggerConfig } from '../interfaces/interfaces'

export const LOAD_CONFIG: LoggerConfig = {
    start: 'Downloading local storage file',
    success: 'localstore.json file downloaded successfully!',
    fail: 'Error downloading localstore.json',
}

export const READ_CONFIG: LoggerConfig = {
    start: 'Reading local storage file from filesystem',
    success: 'Successfully loaded localstore.json from filesystem',
    fail: reason => `Error loading localstore.json from filesystem: ${reason}`,
}

export const LOCAL_STORE_FILE = 'localstore.json'

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
