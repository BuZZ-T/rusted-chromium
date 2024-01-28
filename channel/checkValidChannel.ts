import type { Channel, Platform } from '../interfaces/os.interfaces'

// TODO: add 'Extended' (and maybe others), add missing platforms
const validChannels: Record<Platform, Set<Channel>> = {
    Android: new Set(['Canary', 'Dev', 'Beta', 'Stable']), // 'Canary_asan'
    FuchsiaWebEngine: new Set(['Dev', 'Beta', 'Stable', 'Extended']),
    iOS: new Set(['Canary', 'Dev', 'Beta', 'Stable']),
    Lacros: new Set(['Canary', 'Dev', 'Beta', 'Stable']),
    Linux: new Set(['Dev', 'Beta', 'Stable']),
    Mac: new Set(['Canary', 'Dev', 'Beta', 'Stable', 'Extended']),
    Windows: new Set(['Canary', 'Dev', 'Beta', 'Stable', 'Extended']),
}

export function checkValidChannel(channel: Channel, platform: Platform): {valid: boolean, validChannels: Array<Channel>} {
    const isValid = validChannels[platform].has(channel)
    if (isValid) {
        return {valid: true, validChannels: [] }
    }

    return { valid: validChannels[platform].has(channel), validChannels: Array.from(validChannels[platform])}
}
