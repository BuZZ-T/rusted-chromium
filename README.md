# rusted chromium

[![NPM Version](https://img.shields.io/npm/v/rusted-chromium.svg)](https://www.npmjs.com/package/rusted-chromium) [![Package License](https://img.shields.io/npm/l/rusted-chromium.svg)](https://www.npmjs.com/package/rusted-chromium) [![Build Status](https://img.shields.io/github/actions/workflow/status/BuZZ-T/rusted-chromium/test.yml?branch=main)](https://img.shields.io/github/actions/workflow/status/BuZZ-T/rusted-chromium/test.yml?branch=main)

This cli tool can be used to download old (and therefore unsupported) versions of chromium.

## Table of contents

* [Disclaimer](#disclaimer-)
* [Installation](#installation)
* [Build on your own](#build-on-your-own)
* [Supported node versions](#supported-node-versions)
* [All available flags](#all-available-flags)
* [Examples](#examples)
* [Chromium Version Format](#chromium-version-format)
* [Use as API](#use-as-api)
* [FAQ](#faq)

## Disclaimer 🔥

Reasons to use this tool:

* Verify that bugs that look browser-version-related, really are.

Reasons to NOT use this tool:

* Reobtain removed functionality in Chrome(-ium)

To be explicit:

**⚠️ The downloaded versions are *OUTDATED* and *UNSUPPORTED*! Some known and exploitable bugs, that are already fixed on newer versions, still exist. That's why new versions were released! Use this only for debugging purposes for websites YOU CONTROL! NEVER use these versions for browsing! NEVER EVER enter private data in these browser versions and NEVER EVER login to accounts with these browser versions!!! ⚠️**

## Installation

**ⓘ Versions older than 0.1.0 are not working anymore. Please see the [FAQ](#rusted-chromium-is-not-working-anymore-i-get-a-410-gone-http-statuscode-from-a-chrome-api) and upgrade.**


#### via npm

```
npm install -g rusted-chromium
rusted-chromium --help
```

#### via docker

```sh
docker pull buzztt/rusted-chromium

mkdir out
docker run -ti --mount type=bind,source="$(pwd)/out",target=/app/out-dir rusted-chromium --folder out-dir
```

## Build on your own

#### using npm
```sh
git clone https://github.com/BuZZ-T/rusted-chromium
cd rusted-chromium
npm install
npm test

# using ts-node
npm start -- --help # the two extra dashes are important to pass arguments to the script!
# building and running
npm run build
./bin/rusted-chromium.js --help

```

#### using docker
```sh
git clone https://github.com/BuZZ-T/rusted-chromium

cd rusted-chromium
docker build -t rusted-chromium .
```

## Supported node versions

18.x, 20.x, 22.x, 23.x

## All available flags

| Flag | Short | Parameter | Default | Description |
|-|-|-|-|-
|`--single`|`-s`| string | - | Use a specific version. No interactive prompt is displayed. Several flags have no effect (like `-d`, `-i`, `-n`, `-M`, `-m`, `-r` and `-O`). Terminates with an error status code of 1, if no binary exists.
| `--max`| `-M` | integer | 10000 | Maximum version which should be selectable.
| `--min`| `-m` | integer | 0 | Minimum version which should be selectable.
| `--max-results`| `-r` | integer | 10 | Maximum number of results to select. Directly downloads the binary, if set to 1. **Important:**  `--max-results` is set to `Infinity`, if `--min` is set and `--max-results` is not set, so the default is overridden!
| `--os`| `-o` | "win"/"linux"/"mac"/"darwin" | The operation system on the current system | Set the operation system of the binary.
| `--arch`| `-a` |  "x86"/"x64" for "win" or "linux.  "x64"/"arm" for "mac" | The architecture on the current system | Set the architecture of the binary. The flag is only regarded, if `--os` is present.
| `--channel` | `-c` | "Canary"/"Dev"/"Beta"/"Stable" (depending on architecture) | "Stable" | Set the channel for fetching releases.
| `--unzip` | `-z` | - | - | Directly unzip the downloaded zip-file and delete the .zip afterwards
| `--decrease-on-fail`| `-d` | - | - | Automatically try the next lower version, if the selected version has no binary.
| `--increase-on-fail`| `-i` | - | - | Automatically try the next higher version, if the selected version has no binary.
|`--non-interactive` | `-n` | - | - | Don't display the version selection. Automatically select the newest version in the available range (set by `--min`, `--max` and `--max-results`). Only works when `--decrease-on-fail` is set as well.
|`--no-download` | `-l` | - | - | Don't download the binary if it's found.
|`--hide-negative-hits` | `-H` | - | false | Hide negative hits in the CLI prompt
|`--folder` | `-f` | `path/to/folder` | Current folder executing the command | Set the folder to which the archive of the chromium binary or the extracted folder (if the flag `--unzip` is set)
|`--only-newest-major` | `-O`| - | - | Show only the newest version for every major version in the user selection. If the newest versions are not available for the current os, they are skipped.
| `--list` | | - | false | Only log all matching versions to stdout, quit the program afterwards.
| `--quiet` | `-q` | - | false | Suppress all log output.
|`--no-color` | `-C` | - | false | Suppress colors in log output.
|`--no-progress` | `-P` | - | false | Suppress progress bar log output.
| `--debug` | | - | false | Add additional debug logging.
| `--version`| `-V` | - | - | Show current version.
| `--help`| `-h` | - | - | Display a help with all available flags.

## Examples

##### Download a specific version, exit and fail if it does not exist
```bash
# long version
rusted-chromium --single 70.0.3539.100
# short version
rusted-chromium -s 70.0.3539.100
```

##### Define a minimum and maximum major version
```bash
# long version
rusted-chromium --min 60 --max 70
# short version
rusted-chromium -m 60 -M 70
```
##### Define a maximum major/minor version
*NOTE: Currently makes no sense, as the minor version is always "0".*
```bash
rusted-chromium --max 70.0
```

##### Define a maximum major/minor/branch version
```bash
rusted-chromium --max 70.0.3539
```
##### Define a maximum major/minor/branch/patch version
```bash
rusted-chromium --max 70.0.3539.100
```

##### Define a maximum version and an amount of results
```bash
# long version
rusted-chromium --max 70 --max-results 30
# short version
rusted-chromium -M 70 -r 30
```

##### Don't download anything

```bash
# long version
rusted-chromium --max 80 --decrease-on-fail -non-interactive --no-download
# short version
rusted-chromium -M 80 -dnl
```

##### Directly download the version without interactive selection
*NOTE: This supports `--max` `--min` as well!*
```bash
# long version
rusted-chromium --max-results 1
# short version
rusted-chromium -r 1
```

##### Automatically unzip the downloaded archive
```bash
# long version
rusted-chromium --unzip
# short version
rusted-chromium -z
```

##### Automatically try the next lower version, if the selected version has no binary
*NOTE: This regards `--min`, `--max` and `--max-results`*
```bash
# long version
rusted-chromium --max 30 --decrease-on-fail
# short version
rusted-chromium -M 30 -d
```

##### Automatically try the next higher version, if the selected version has no binary
*NOTE: This regards `--min`, `--max` and `--max-results`*
```bash
# long version
rusted-chromium --max 30 --increase-on-fail
# short version
rusted-chromium -M 30 -i
```

##### Automatically select the newest of 7 results and automatically try the next lower version, if the tried version has no binary
```bash
# long version
rusted-chromium --max 78 --max 79.0.3909.0 --max-results 7 --decrease-on-fail --non-interactive
# short version
rusted-chromium -M 79.0.3909.0 -r 7 -d -n
```

##### Download to an alternative directory
```bash
# long version
rusted-chromium --folder /tmp/rusted
# short version
rusted-chromium -f /tmp/rusted
```

##### Suppress colors in log output
```bash
# long version
rusted-chromium --no-color
# short version
rusted-chromium -c
```

##### Suppress progress bars in log output
```bash
# long version
rusted-chromium --no-progress
# short version
rusted-chromium -P
```

##### Suppress all log output
```bash
# long version
rusted-chromium --quiet
# short version
rusted-chromium -q
```

##### List all matching versions and quit
```bash
rusted-chromium --list
```

##### Show the help and quit
```bash
# long version
rusted-chromium --help
# short version
rusted-chromium -h
```

##### Show the version and quit
```bash
# long version
rusted-chromium --version
# short version
rusted-chromium -V
```

## Chromium Version Format

A chrom(e/ium) version might look like this: "60.0.3112.93". The version can be split in:

* Major version (here: "60")
* Minor version (here: "0")
* Branch version (here: "3112")
* Patch version (here: "93")

The minor version is not used and is always "0".

Contrary to what [semantic versioning](https://semver.org/) would require, the branch version is not reset to zero, when the major version is increased. Instead, the branch version is also increased.

E.g. the latest 60.x version is "60.0.3112.118", the first 61.x version is "61.0.3113.0".

### Partial Chromium Version Format

When declaring the Chromium Version Format in **rusted-chromium**, prefixes can be used.
E.g.:

* "60" means "any version with major version 60"
* "60.0.3112" means "version 60.0.3112 with arbatrary patch version"

## Use as API

rusted-chromium can be used as API as well. See more examples [here](https://github.com/BuZZ-T/rusted-chromium/blob/main/examples/README.md).

### Download chromium

To download a chromium version, use `downloadChromium`:
```ts
import { ComparableVersion, downloadChromium } from 'rusted-chromium';

downloadChromium({
    arch: 'x64',
    autoUnzip: false,
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
```

### Directly pass CLI flags
If you want to directly pass `process.argv` and extend or restrict the available flags, directly import `rusted`:
```ts
import { rusted } from 'rusted-chromium'

rusted(process.argv, 'linux')

```

### Use defaults and override specific settings

This is probably the most useful version in a CI envionment. This requires less config options, as many of them are not regarded when using `single`.

```ts
import { downloadChromium } from 'rusted-chromium';

downloadChromium.withDefaults({
    arch: 'x64',
    single: "10.0.0.0",
    os: 'linux',
    autoUnzip: false,
    download: true,
    downloadFolder: null,
});
```

### Use the fluent API

The fluent API can be accessed by using `.with`.

```ts
import { downloadChromium } from 'rusted-chromium'

downloadChromium.with
    .arch('x64')
    .os('linux')
    .interactive()
    .start()
```

For the single mode (in normal config `single: <version>`), use `.withSingle`:

```ts
downloadChromium.withSingle
	.download()
	.autoUnzip()
	.single('10.11.12.13')
	.start()
```

Be aware that `.start()` is only available, after `.single(...)` has been used.

**See more examples to use the API [here](https://github.com/BuZZ-T/rusted-chromium/blob/main/examples/README.md).**

## FAQ

### Why do you often write "Chrom(e/ium)"?

The famous browser chrome is based on the free licensed browser chromium. If you use **rusted-chromium**, you are downloading a chromium version. The [versioning](#chromium-version-format) are used for both chrome and chromium so "Chrom(e/ium)" means "the version of chrome and/or chromium"

### Can i contribute?
I'm accepting pull requests and feature requests (no guarantee that i will implement this fast or implement this at all, but feel free to ask).

### Do you build chromium versions? Do you store chromium binaries/archives? Do you have your own chromium repository?

NO, NO and NO. This CLI basically automates the manual steps mentioned [here](https://www.chromium.org/getting-involved/download-chromium/#downloading-old-builds-of-chrome-chromium).
So only official chromium APIs are called and only official binaries are downloaded.

So, this project:

* has **NO own repository** for chromium sources
* **does not build** versions of chromium itself
* **does not store** binaries or archives of chromium

### I'm starting a downloaded version, but it has the same version as my normally installed one...

A session with the newer version was still running. In this case, chrom(e/ium) detects that and launches a window in the same session.
There are two possible solutions for this:

* Make sure to first close all running instances of chrom(e/ium)!
* Start your downloaded version of chromium with the flag `--user-data-dir=<folder>`. See [chromium.googlesource.com](https://chromium.googlesource.com/chromium/src.git/+/master/docs/user_data_dir.md#overriding-the-user-data-directory) for more information.

### rusted-chromium is not working anymore. I get a 410 Gone HTTP-Statuscode from a chrome API...

The  [OmahaProxy](https://omahaproxy.appspot.com/), which API was used by rusted-chromium, has been switched off. With version 0.1.0, rusted-chromium migrated to [ChromiumDash](https://chromiumdash.appspot.com/) and is functional again. But earlier versions, with version number "0.0.X" are not usable anymore. Be sure to install version 0.1.0 or later!

### What is new / has changed?

See the [Changelog](CHANGELOG.md).
