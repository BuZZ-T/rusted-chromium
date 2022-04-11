import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium.withSingle
    .arch('x64')
    .os('linux')
    .single(new ComparableVersion(10, 0, 0, 0))
    .start()
