import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium({
    arch: 'x64',
    autoUnzip: false,
    download: true,
    hideNegativeHits: false,
    interactive: true,
    inverse: false,
    max: new ComparableVersion(95, 0, 0, 0),
    min: new ComparableVersion(0,0,0,0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    quiet: false,
    store: true,
    results: 10,
    downloadFolder: null,
    single: null,
    debug: false,
    list: false,
})
