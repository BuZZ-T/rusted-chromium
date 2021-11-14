import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium({
    single: new ComparableVersion(98, 0, 4707, 2),
    os: 'linux',
    arch: 'x64',
})
