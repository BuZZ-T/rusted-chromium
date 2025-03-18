# Changelog

## 0.3.1

* remove coveralls (not in use anymore and with currently unfixable vulnerabilities)>
* remove travis ci config (replaced by github actions)
* upgrade several packages for update or security reasons
  * upgrade
  * cross-spawn
  * eslint, eslint-plugin-jest
  * @typescript-eslint/eslint-plugin, @typescript-eslint/parser
  * @types/jest, @types/node

## 0.3.0

* upgrade several package to the latest version
* drop support of Node 21
* added support of Node 23
* fix conflicting short flag `-c` of `--no-color` and `--channel`
* upgrade packages to fix security vulnerabilities in example projects

## 0.2.0

* replace `--production` with `--omit=dev` flag in Dockerfile
* updated supported node versions in README.md
* add github-actions build status
* add eslint-plugin-jest-mock-config
* add tsc config noUncheckedIndexedAccess
* add github action
* upgrade eslint to 8
* display temporarily disabled versions
* add consistent-type-imports eslint rule
* remove support for localstore.json file
* add `--no-progress` removing the progress bar for CI logs
* show abort warning on CTRL-C while downloading
* add CHANGELOG.md, link in README.md FAQ
* make compare and nextMajorVersion of ComparableVersion non-static

## 0.1.0
* migrate project to new Chromium API

## 0.0.21
 * (no mentionable changes)

## 0.0.20
* README information that rusted-chromium is not working anysmore
* add node 21 to supported versions

## 0.0.19
 * (no mentionable changes)

## 0.0.18
* add Dockerfile
* add `--ignore-store`
* use `process.cwd()` instead of `__dirname` for current dir in subfolder-file
* regards disabled versions for `--only-newest-major` correctly
* switch ci to node 18/20
* add `--no-color` to suppress colors in log output
* add README.md for `--list` and `--debug`
* add `--list` to log all versions matching the criteria
* add `--only-newest-major` integration test

## 0.0.17
* Add fluent interface for download API
* show supported node version in README.md
* fix logging "Binary found" twice
* limit results after reversing
* add debug: boolean to all API calls
* fix endless spinner on last version already disabled when `--no-download`
* log a warning if all versions are disabled
* log correct "with next higher/lower version" on `--inverse`
* add `--debug` for `logger.debug`

## 0.0.16
* Disable "no-binary"-versions in prompt, even with `--no-store`
* Add `downloadChromium.withDefaults()` to download API
* replace unzipper with extract-zip
* Add examples/ sub-project
* add links to coverage-report in README.md
* write coverage files for integration tests in coverage-int/ folder

## 0.0.15
* Add coverage badge for integration tests
* Add jest-runner-groups to split unit and int tests
* Add integration test setup and first test
* Add docu and tests for `--quiet`
* Add `--quiet`/`-q` parameter to suppress all logging output
* Added mac/arm as valid os/arch combination
* CI Build should break on failing tests
* Add public_api.ts for using rusted-chromium as API

## 0.0.14
* Add `--export-store` to print localstore.json
* Remove partly downloaded file on CTRL-C while downloading
* Remove "Caution"-Notice (2 years, 4 months ago) <Bastian Gebhardt>
* Sort store on adding negative hit
* Fix `--import-store` for filesystem store
* Store localstore file in root folder, not in `store/`
* Added `--inverse` to sort inteactive selection ascending
* Added `--help` text for `--single`
* Use markdown badges in README
* Add coverage reports to coveralls
* Adding linting and building to travis ci
* Added node 14, 16 to travis build
* Renaming `--decreaseOnFail` and `--increaseOnFail` to `...-on-fail` for consistant flags

## 0.0.13
* Have`--single` exit with error code on no binary found
* Add `--single` to download a specific version
* Change `--load-store` to `--import-store`
* Don't request already disabled versions on using `--decreaseOnFail` or `--increaseOnFail`

## 0.0.12
* Add `--only-newst-major`/`-O` to show only the newest version for each major in the user selection
* Added `--folder`/`-f` to download chromium to a different folder
* Hide negative hits with `--hide-negative-hits` or `-H`
* Set max-results to Infinity, if `--min` and `--max` are present

## 0.0.11
* Added `--user-data-dir` to README.md
Gebhardt>

## 0.0.10
* Add --load-store to download localstore.json file from given URL (3 years, 5 months ago) <Bastian Gebhardt>
Gebhardt>

## 0.0.9
* Add flag `--no-download`/`-l` to not download binary, even if found
* Store negative hits for versions in localstore.json
* Add debug run-script
* Add .travis.yml

## 0.0.8
 * (no mentionable changes)
 
## 0.0.7
 * (no mentionable changes)
 
## 0.0.6
 * (no mentionable changes)
 
## 0.0.5
 * (no mentionable changes)
 
## 0.0.4
 
 * (no mentionable changes)

## 0.0.3
 * (no mentionable changes)
