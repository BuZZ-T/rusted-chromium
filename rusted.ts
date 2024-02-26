import { readConfig } from './config/config'
import { downloadChromium } from './download/download'

export async function rusted(args: string[], platform: NodeJS.Platform): Promise<void> {
    const config = readConfig(args, platform)

    await downloadChromium(config)
}
