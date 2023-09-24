import { createReadStream } from 'node:fs'
import { join } from 'node:path'

import { LOCAL_STORE_FILE } from '../commons/constants'
import { NoLocalstoreError } from '../errors'
import type { IExportConfig } from '../interfaces/interfaces'
import { applyConfigToLoggers } from '../log/logger.utils'
import { existsAndIsFile } from '../utils/file.utils'

export async function exportStore(config: IExportConfig, stdio: NodeJS.WriteStream): Promise<void> {
    applyConfigToLoggers(config)

    const filePath = config.path ?? join(__dirname, '..', LOCAL_STORE_FILE)
    if (!(await existsAndIsFile(filePath))) {
        throw new NoLocalstoreError(config.path)
    }

    const reader = createReadStream(filePath)
    reader.pipe(stdio)
}
