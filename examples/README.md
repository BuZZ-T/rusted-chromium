# Examples for using rusted-chromium as API

## Setup

**in rusted-chromium folder:**
```
# in rusted-chromium folder:
npm install
npm run build
```

**switch to examples folder:**
```
cd examples
npm install
```

## Usage

**run directly using ts-node:**
```bash
npx ts-node example-download-single.ts
```

**build first:**
```bash
npm run build
node example-download-single.js
```

## Available examples

### example-download-all-params.ts
Opens the cli prompt with a specific configuration (max version 95, ten results, ...).
```ts
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
})
```

### example-download-single.ts

Downloads a specific version (98.0.4707.2) for Linux 64-Bit.

```
import { ComparableVersion, downloadChromium } from 'rusted-chromium'

downloadChromium({
    single: new ComparableVersion(98, 0, 4707, 2),
    os: 'linux',
    arch: 'x64',
})
```

### example-download.ts
Opens the cli prompt with the default configuration, only setting os and arch.
```ts
import { downloadChromium } from 'rusted-chromium'

downloadChromium({
    arch: 'x64',
    os: 'linux',
})
```

### example-download-default-config.ts
Opens the cli prompt with the default configuration.
```ts
import { downloadChromium } from 'rusted-chromium'

downloadChromium()
```

### example-export.ts
Exports the localstore.json to stdout.
```ts
import { exportStore } from 'rusted-chromium'

exportStore({
    quiet: false,
}, process.stdout)
```

### example-import.ts
Imports the localstore.json from a URL and merges it with an existing localstore.json file (if it exists).
```ts
import { importAndMergeLocalstore } from 'rusted-chromium'

importAndMergeLocalstore({
    quiet: false,
    url: 'https://rusted.buzz-t.eu/localstore.json'
})
```
