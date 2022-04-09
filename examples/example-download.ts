import { downloadChromium } from 'rusted-chromium'

downloadChromium.withDefaults({
    arch: 'x64',
    os: 'linux',
})
