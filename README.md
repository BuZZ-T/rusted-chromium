# rusted chromium

<a href="https://www.npmjs.com/package/rusted-chromium"><img src="https://img.shields.io/npm/v/rusted-chromium.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/rusted-chromium"><img src="https://img.shields.io/npm/l/rusted-chromium.svg" alt="Package License" /></a>
<a href="https://travis-ci.com/github/BuZZ-T/rusted-chromium"><img src="https://travis-ci.com/BuZZ-T/rusted-chromium.svg?branch=master" alt="Build" /></a>

This cli tool can be used to download old (and therefore unsupported) versions of chromium.

## Caution

In case you found this tool: This is not ready-to-use yet. You might be able to use it, but the documentation is incomplete and some features are not implemented yet. Contact me for more information: <a href="mailto:buzz-t@buzz-t.eu">buzz-t@buzz-t.eu</a>

## Table of contents

* [Disclaimer](#disclaimer-)
* [Installation](#installation)
* [All available flags](#all-available-flags)
* [Examples](#examples)
* [Store file](#store-file)
* [FAQ](#faq)

## Disclaimer 🔥

Reasons to use this tool:

* Verify that bugs that look browser-version-related, really are.

Reasons to NOT use this tool:

* Reobtain removed functionality in Chrome(-ium)

To be explicit:

**⚠️ The downloaded versions are *OUTDATED* and *UNSUPPORTED*! Some known and exploitable bugs, that are already fixed on newer versions, still exist. That's why new versions were released! Use this only for debugging purposes for websites YOU CONTROL! NEVER use these versions for browsing! NEVER EVER enter private data in these browser versions and NEVER EVER login to accounts with these browser versions!!! ⚠️**

## Installation

#### via npm

```
npm install -g rusted-chromium
rusted-chromium --help
```

#### via github

```
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

## All available flags

| Flag | Short | Parameter | Default | Description |
|-|-|-|-|-
| `--max`| `-M` | integer | 10000 | Maximum version which should be selectable.
| `--min`| `-m` | integer | 0 | Minimum version which should be selectable.
| `--max-results`| `-r` | integer | 10 | Maximum number of results to select. Directly downloads the binary, if set to 1. **Important:**  `--max-results` is set to `Infinity`, if `--min` is set and `--max-results` is not set, so the default is overridden!
| `--os`| `-o` | "win"/"linux"/"mac"/"darwin" | The operation system on the current system | Set the operation system of the binary. Valid values are "win", "linux" and "mac"/"darwin".
| `--arch`| `-a` |  "x86"/"x64" "x86" is ignored for os "mac" | The architecture on the current system | Set the architecture of the binary. The flag is only regarded, if `--os` is present.
| `--unzip` | `-z` | - | - | Directly unzip the downloaded zip-file and delete the .zip afterwards
| `--decreaseOnFail`| `-d` | - | - | Automatically try the next lower version, if the selected version has no binary.
| `--increaseOnFail`| `-i` | - | - | Automatically try the next higher version, if the selected version has no binary.
|`--non-interactive` | `-n` | - | - | Don't display the version selection. Automatically select the newest version in the available range (set by `--min`, `--max` and `--max-results`). Only works when `--decreaseOnFail` is set as well.
|`--no-download` | `-l` | - | - | Don't download the binary if it's found.
|`--import-store` | `-I` | URL/File path | - | Download the store file "localstore.json" from a given URL or load it from a given path of the filesystem. Merges the import with an already existing store.
|`--hide-negative-hits` | `-H` | - | false | Hide negative hits in the CLI prompt
|`--folder` | `-f` | `path/to/folder` | Current folder executing the command | Set the folder to which the archive of the chromium binary or the extracted folder (if the flag `--unzip` is set)
|`--only-newest-major` | `-O`| - | - | Show only the newest version for every major version in the user selection. If the newest versions are not available for the current os, they are skipped.
| `--version`| `-V` | - | - | Show current version.
| `--help`| `-h` | - | - | Display a help with all available flags.

## Examples

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

##### Don't download anything, just mark negative hits in the local store

```bash
# long version
rusted-chromium --max 80 --decreaseOnFail -non-interactive --no-download
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
*NOTE: This is using `unzipper` which loses executable flags for binaries*
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
rusted-chromium --max 30 --decreaseOnFail
# short version
rusted-chromium -M 30 -d
```

##### Automatically try the next higher version, if the selected version has no binary
*NOTE: This regards `--min`, `--max` and `--max-results`*
```bash
# long version
rusted-chromium --max 30 --increaseOnFail
# short version
rusted-chromium -M 30 -i
```

##### Automatically select the newest of 7 results and automatically try the next lower version, if the tried version has no binary
```bash
# long version
rusted-chromium --max 78 --max 79.0.3909.0 --max-results 7 --decreaseOnFail --non-interactive
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

##### Import a store file (and merge it with an existing store, if available)
```bash
# URL
rusted-chromium --import-store https://url/to/localstore.json
# filesystem
rusted-chromium --import-store /path/to/file
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

## Store file

It's possible that for a given combination of

* operating system (windows/linux/mac)
* architecture (32-bit/64-bit)
* version (e.g. 63.0.3239.150)

a binary might be not available.
The reason for this is, if a new patch is released, it might only fix bugs for a certain combination of operating system and architecture. For all other combinations might no new version be released.
Unfortunately, this can only be detected at the very end of the api-call chain.

Every time a "negative hit" (so no binary is available) is detected, this is written to a Store file `localstore.json` in the same folder as the `rusted-chromium` executable.
The next time a range of versions is requested by `rusted-chromium`, this version is automatically marked "not-available".

### Download Store file

You can use `rusted-chromium` to download an existing `localstore.json` file, to setup an initial state of known unexisting binaries.
This project provides one under https://rusted.buzz-t.eu/localstore.json, but there is no need to use it.

## FAQ

### Can i contribute?
I'm accepting pull requests and feature requests (no guarantee that i will implement this fast or implement this at all, but feel free to ask).

### Do you build chromium versions? Do you store chromium binaries/archives? Do you have your own chromium repository?

NO, NO and NO. This CLI basically automates the manual steps mentioned in https://www.chromium.org/getting-involved/download-chromium in the section "Downloading old builds of Chrome / Chromium".
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