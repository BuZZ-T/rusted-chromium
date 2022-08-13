import type { Stats } from 'fs'
import { stat } from 'fs/promises'

async function exists(filename: string): Promise<Stats | false> {
    try {
        return await stat(filename)
    } catch(e) {
        return false
    }
}

export async function existsAndIsFile(filename: string): Promise<boolean> {
    const fileExists = await exists(filename)

    return fileExists && fileExists.isFile()
}

export async function existsAndIsFolder(filename: string): Promise<boolean> {
    const fileExists = await exists(filename)

    return fileExists && fileExists.isDirectory()
}
