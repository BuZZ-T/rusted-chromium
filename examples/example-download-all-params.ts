import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium({
    arch: 'x64',
    autoUnzip: false,
    channel: 'Stable',
    color: true,
    debug: false,
    download: true,
    downloadFolder: null,
    hideNegativeHits: false,
    interactive: true,
    inverse: false,
    list: false,
    max: new ComparableVersion(95, 0, 0, 0),
    min: new ComparableVersion(0,0,0,0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    progress: true,
    quiet: false,
    results: 10,
    single: null,
})
