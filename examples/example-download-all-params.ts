import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium({
    arch: 'x64',
    autoUnzip: false,
    color: true,
    debug: false,
    download: true,
    downloadFolder: null,
    hideNegativeHits: false,
    ignoreStore: false,
    interactive: true,
    inverse: false,
    list: false,
    max: new ComparableVersion(95, 0, 0, 0),
    min: new ComparableVersion(0,0,0,0),
    onFail: 'nothing',
    onlyNewestMajor: false,
    os: 'linux',
    quiet: false,
    results: 10,
    single: null,
    store: true,
})
