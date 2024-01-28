/**
 * Tests versions file
 *
 * @group unit/file/releases
 */

import { fetchReleases } from '../api'
import { LOAD_RELEASES } from '../commons/loggerTexts'
import { MappedVersion } from '../commons/MappedVersion'
import { logger } from '../log/logger'
import { spinner } from '../log/spinner'
import { ComparableVersion } from '../public_api'
import { Store } from '../store/Store'
import { createApiRelease, createChromeFullConfig, createChromeSingleConfig, createStore } from '../test/test.utils'
import { Release } from './release.types'
import { loadReleases, mapApiReleasesToReleases } from './releases'

jest.mock('../log/spinner')
const spinnerMock = jest.mocked(spinner)

jest.mock('../log/logger')
const loggerMock = jest.mocked(logger)

jest.mock('../api')
const fetchReleasesMock = jest.mocked(fetchReleases)

const apiRelease1 = createApiRelease({ chromium_main_branch_position: 1, version: '10.0.0.0' })
const apiRelease2 = createApiRelease({ chromium_main_branch_position: 2, version: '20.0.0.0' })

describe('releases', () => {
    beforeEach(() => {
        spinnerMock.start.mockClear()
        spinnerMock.success.mockClear()
        spinnerMock.error.mockClear()
        loggerMock.debug.mockClear()
    })

    describe('loadReleases', () => {
        it('should load the releases', async () => {
            fetchReleasesMock.mockResolvedValue([ apiRelease1, apiRelease2 ])

            const releases = await loadReleases('linux', 'Dev')

            expect(releases).toEqual([ apiRelease1, apiRelease2 ])

            expect(loggerMock.debug).toHaveBeenCalledTimes(1)
            expect(loggerMock.debug).toHaveBeenCalledWith('Loading releases for linux Dev...')
            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_RELEASES)
            expect(spinnerMock.success).toHaveBeenCalledTimes(1)
            expect(spinnerMock.success).toHaveBeenCalledWith()
            expect(spinnerMock.error).toHaveBeenCalledTimes(0)
        })

        it('should log an error on failing request', async () => {
            fetchReleasesMock.mockRejectedValue(new Error('some-error'))

            const releases = await loadReleases('linux', 'Dev')

            expect(releases).toEqual([])

            expect(loggerMock.debug).toHaveBeenCalledTimes(1)
            expect(loggerMock.debug).toHaveBeenCalledWith('Loading releases for linux Dev...')
            expect(spinnerMock.start).toHaveBeenCalledTimes(1)
            expect(spinnerMock.start).toHaveBeenCalledWith(LOAD_RELEASES)
            expect(spinnerMock.success).toHaveBeenCalledTimes(0)
            expect(spinnerMock.error).toHaveBeenCalledTimes(1)
            expect(spinnerMock.error).toHaveBeenCalledWith()
        })

    })

    describe('mapApiReleaseToRelease', () => {
        it('should sort the versions', () => {
            const config = createChromeFullConfig()

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 123, version: '10.1.2.3' }),
                createApiRelease({ chromium_main_branch_position: 456, version: '20.0.0.0' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[] = [{
                branchPosition: 456,
                version: new MappedVersion(20, 0, 0, 0, false),
            }, {
                branchPosition: 123,
                version: new MappedVersion(10, 1, 2, 3, false),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should mark versions found in store as disabled', () => {
            const config = createChromeFullConfig({
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 123, version: '10.1.2.3' }),
                createApiRelease({ chromium_main_branch_position: 456, version: '10.1.2.4' }),
            ], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.4'],
                    x86: []
                }
            })))

            const expectedReleases = [
                {
                    branchPosition: 456,
                    version: new MappedVersion({
                        major: 10,
                        minor: 1,
                        branch: 2,
                        patch: 4,
                        disabled: true,
                    }),
                },
                {
                    branchPosition: 123,
                    version: new MappedVersion({
                        major: 10,
                        minor: 1,
                        branch: 2,
                        patch: 3,
                        disabled: false,
                    }),
                }
            ]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should remove disabled versions on hideNegativeHits set in config', () => {
            const config = createChromeFullConfig({
                hideNegativeHits: true,
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 123, version: '10.1.2.3' }),
                createApiRelease({ chromium_main_branch_position: 456, version: '10.1.2.4' }),
            ], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.4'],
                    x86: []
                }
            })))

            const expectedReleases: Release[] = [{
                branchPosition: 123,
                version: new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 3,
                    disabled: false,
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should filter out versions less than config.min', () => {
            const config = createChromeFullConfig({
                min: new ComparableVersion(30, 0, 0, 0)
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '29.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.1.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[] = [{
                branchPosition: 1,
                version: new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false,
                }),
            }, {
                branchPosition: 2,
                version: new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should filter out versions greater than config.max', () => {
            const config = createChromeFullConfig({
                max: new ComparableVersion(30, 0, 0, 0),
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '30.0.0.1' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '29.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 5, version: '10.1.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[] = [{
                branchPosition: 2,
                version: new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            }, {
                branchPosition: 4,
                version: new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false,
                }),
            }, {
                branchPosition: 5,
                version: new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false,
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should strip the versions based to config.results', () => {
            const config = createChromeFullConfig({
                results: 3,
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '20.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.1.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[]  = [{
                branchPosition: 1,
                version: new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false,
                }),
            }, {
                branchPosition: 2,
                version: new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false,
                }),
            }, {
                branchPosition: 3,
                version: new MappedVersion({
                    major: 20,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should filter the versions if --only-newest-major is set', () => {
            const config = createChromeFullConfig({
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '10.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.0.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[]  = [{
                branchPosition: 1,
                version: new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false
                }),
            },
            {
                branchPosition: 2,
                version: new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false
                }),
            },
            {
                branchPosition: 3,
                version: new MappedVersion({
                    major: 10,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should filter the versions if --only-newest-major is set with version in the middle disabled', () => {
            const config = createChromeFullConfig({
                arch: 'x64',
                os: 'linux',
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '119.0.6021.1' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '119.0.6010.1' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '119.0.6004.1' }),
            ], config, new Store(createStore({
                linux: {
                    x64: ['119.0.6010.1'],
                    x86: [],
                },
            })))

            const expectedReleases: Release[]  = [{
                branchPosition: 1,
                version: new MappedVersion({
                    major: 119,
                    minor: 0,
                    branch: 6021,
                    patch: 1,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should filter the versions if --only-newest-major is set with the first version disabled', () => {
            const config = createChromeFullConfig({
                arch: 'x64',
                os: 'linux',
                onlyNewestMajor: true,
                results: 10,
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '119.0.6021.1' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '119.0.6010.1' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '119.0.6004.1' }),
            ], config, new Store(createStore({
                linux: {
                    x64: ['119.0.6021.1'],
                    x86: [],
                },
            })))

            const expectedReleases: Release[]  = [{
                branchPosition: 2,
                version: new MappedVersion({
                    major: 119,
                    minor: 0,
                    branch: 6010,
                    patch: 1,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should return the provided version on config.single, even if it\'s marked as disabled in the store', () => {
            const config = createChromeSingleConfig({
                single: new ComparableVersion(10, 1, 2, 3),
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '29.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.1.2.3' }),
            ], config, new Store(createStore({
                linux: {
                    x64: ['10.1.2.3'],
                    x86: []
                }
            })))

            const expectedReleases: Release[]  = [{
                branchPosition: 4,
                version: new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 3,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should not return the provided version on config.single, if it\'s not found in the releases', () => {
            const config = createChromeSingleConfig({
                single: new ComparableVersion(10, 1, 2, 3),
                os: 'linux',
                arch: 'x64',
            })

            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '29.0.2000.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[]  = []

            expect(mapped).toEqual(expectedReleases)
        })

        it('should return an ascending list on --inverse', () => {
            const config = createChromeFullConfig({
                inverse: true,
            })
            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '29.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.1.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[]  = [{
                branchPosition: 4,
                version: new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false
                }),
            }, {
                branchPosition: 3,
                version: new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            }, {
                branchPosition: 2,
                version: new MappedVersion({
                    major: 30,
                    minor: 0,
                    branch: 0,
                    patch: 0,
                    disabled: false
                }),
            }, {
                branchPosition: 1,
                version: new MappedVersion({
                    major: 60,
                    minor: 6,
                    branch: 7,
                    patch: 8,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })

        it('should first sort, then inverse and then limit the results on --inverse and --max-results', () => {
            const config = createChromeFullConfig({
                inverse: true,
                results: 2,
            })
            const mapped = mapApiReleasesToReleases([
                createApiRelease({ chromium_main_branch_position: 1, version: '60.6.7.8' }),
                createApiRelease({ chromium_main_branch_position: 2, version: '30.0.0.0' }),
                createApiRelease({ chromium_main_branch_position: 3, version: '29.0.2000.4' }),
                createApiRelease({ chromium_main_branch_position: 4, version: '10.1.2.4' }),
            ], config, new Store(createStore()))

            const expectedReleases: Release[] = [{
                branchPosition: 4,
                version: new MappedVersion({
                    major: 10,
                    minor: 1,
                    branch: 2,
                    patch: 4,
                    disabled: false
                }),
            }, {
                branchPosition: 3,
                version: new MappedVersion({
                    major: 29,
                    minor: 0,
                    branch: 2000,
                    patch: 4,
                    disabled: false
                }),
            }]

            expect(mapped).toEqual(expectedReleases)
        })
    })
})
