import { existsSync, createReadStream } from 'fs'
import { join } from 'path'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { NoLocalstoreError } from '../errors'
import type { IExportConfig } from '../interfaces/interfaces'

export function exportStore(config: IExportConfig, stdio: NodeJS.WriteStream): void {
    const filePath = config.path ?? join(__dirname, '..', LOCAL_STORE_FILE)
    if (!existsSync(filePath)) {
        throw new NoLocalstoreError(config.path)
    }

    const reader = createReadStream(filePath)
    reader.pipe(stdio)
}
