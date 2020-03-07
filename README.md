# rusted chromium

<a href="https://www.npmjs.com/package/rusted-chromium"><img src="https://img.shields.io/npm/v/rusted-chromium.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/rusted-chromium"><img src="https://img.shields.io/npm/l/rusted-chromium.svg" alt="Package License" /></a>

This cli tool can be used to download old (and therefore unsupported) versions of chromium.

## Caution

In case you found this tool: This is not ready-to-use yet. You might be able to use it, but the documentation is incomplete and some features are not implemented yet. And no tests are written, yet. Contact me for more information: <a href="mailto:buzz-t@buzz-t.eu">buzz-t@buzz-t.eu</a>

## Table of contents

* [Disclaimer](#disclaimer-)
* [Installation](#installation)
* [All available flags](#all-available-flags)
* [Examples](#examples)
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
npm start -- --help # the two extra dashes are important to pass arguments to the script!

```

## All available flags

| Flag | Short | Default | Description |
|-|-|-|-
| `--max`| | 10000 | Maximum version which should be selectable
| `--min`| | 0 | Minimum version which should be selectable
| `--max-results`| | 10 | Maximum number of results to select. Directly downloads the binary, if set to 1
| `--os`|  | The operation system on the current system | Set the operation system of the binary. Valid values are "win", "linux" and "mac"/"darwin".
| `--arch`|  | The architecture on the current system | Set the architecture of the binary. The flag is only regarded, if `--os` is present. Valid values are "x86" and "x64". "x86" is ignored for "mac".
| `--decreaseOnFail`| `-d` | false | Automatically try the next lower version, if the selected version has no binary
| `--increaseOnFail`| `-i` | false | Automatically try the next higher version, if the selected version has no binary
| `--version`| `-V` | - | Show current version
| `--help`| `-h` | - | Display a help with all available flags

## Examples

##### Define a minimum and maximum major version
```bash
rusted-chromium --min 60 --max 70
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
rusted-chromium --max 70 --max-results 30
```

##### Directly download the version without interactive selection
*NOTE: This supports `--max` `--min` as well!*
```bash
rusted-chromium --max-results 1
```

##### Automatically unzip the downloaded archive
*NOTE: This is using `unzipper` which loses executable flags for binaries*
```bash
rusted-chromium --unzip
```

##### Automatically try the next lower version, if the selected version has no binary
*NOTE: This regards `--min`, `--max` and `--max-results`*
```bash
# long version
rusted-chromium --max=30 --decreaseOnFail
# short version
rusted-chromium --max=30 -d
```

##### Automatically try the next higher version, if the selected version has no binary
*NOTE: This regards `--min`, `--max` and `--max-results`*
```bash
# long version
rusted-chromium --max=30 --increaseOnFail
# short version
rusted-chromium --max=30 -i
```

##### Show the help
```bash
rusted-chromium --help
```

##### Show the version
```bash
rusted-chromium --version
```
## FAQ

### Can i contribute?
I'm accepting pull requests and feature requests (no guarantee that i will implement this fast or implement this at all, but feel free to ask).

### Do you build chromium versions? Do you store chromium binaries/archives? Do you have your own chromium repository?

NO. This cli basically automates the manual steps mentioned in https://www.chromium.org/getting-involved/download-chromium in the section "Downloading old builds of Chrome / Chromium".
So only official chromium APIs are called and only official binaries are downloaded.

So, this project:

* has **NO own repository** for chromium sources
* **does not build** versions of chromium itself
* **does not store** binaries or archives of chromium