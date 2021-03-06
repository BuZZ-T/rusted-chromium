import { LoggingConfig } from './interfaces'

export const LOAD_CONFIG: LoggingConfig = [
    'Downloading local storage file',
    'localstore.json file downloaded successfully!',
    'Error downloading localstore.json!',
]

export const READ_CONFIG: LoggingConfig = [
    'Reading local storage file from filesystem',
    'Successfully loaded localstore.json from filesystem',
    'Error loading localstore.json from filesystem',
]

export const LOCAL_STORE_FILE = 'localstore.json'

export const RESOLVE_VERSION: LoggingConfig = [
    'Resolving version to branch position...',
    'Version resolved!',
    'Error resolving version!',
]

export const SEARCH_BINARY: LoggingConfig = [
    'Searching for binary...',
    'Binary found.',
    'No binary found!',
]
