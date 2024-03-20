/**
 * Tests config file
 *
 * @group unit/file/config
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { DEFAULT_CONFIG_OPTIONS } from '../commons/constants'
import type { OS } from '../interfaces/os.interfaces'
import type { Logger} from '../log/logger'
import { logger } from '../log/logger'
import { createChromeOptions, createChromeSingleConfig, createChromeFullConfig } from '../test/test.utils'
import { readConfig } from './config'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const program = require('commander')

jest.mock('commander')
jest.mock('../log/logger')

describe('config', () => {

    let programMock: jest.MaybeMockedDeep<typeof program>
    let loggerMock: jest.MaybeMockedDeep<Logger>

    describe('readConfig', () => {

        beforeEach(() => {
            loggerMock = jest.mocked(logger)
            loggerMock.warn.mockClear()

            programMock = jest.mocked(program)
            programMock.version.mockClear()
            programMock.option.mockClear()
            programMock.parse.mockClear()
            programMock.opts.mockClear()

            programMock.version.mockReturnValue(programMock)
            programMock.option.mockReturnValue(programMock)
        })

        it('should pass the args to program.parse()', () => {
            programMock.opts.mockReturnValue(createChromeOptions())

            readConfig(['-a -b -c -d'], 'linux')

            expect(programMock.parse).toHaveBeenCalledTimes(1)
            expect(programMock.parse).toHaveBeenCalledWith(['-a -b -c -d'])
        })

        describe('loadChrome', () => {
            it('should set min version', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    min: '20',
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    min: new ComparableVersion({
                        branch: 0,
                        major: 20,
                        minor: 0,
                        patch: 0,
                    }),
                    results: Infinity,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set max version', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    max: '30.0.1234.33',
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    max: new ComparableVersion({
                        branch: 1234,
                        major: 30,
                        minor: 0,
                        patch: 33,
                    }),
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set decrease on fail', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    decreaseOnFail: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    onFail: 'decrease',
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set increase on fail', () => {
                programMock.opts.mockReturnValue({
                    ...DEFAULT_CONFIG_OPTIONS,
                    increaseOnFail: true,
                })

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    onFail: 'increase',
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set autoUnzip', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    unzip: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    autoUnzip: true,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set results', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    maxResults: '24',
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    results: 24,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set no-download', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    download: false,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    download: false,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set hide negative hits', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    hideNegativeHits: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    hideNegativeHits: true,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should warn on non-interactive without decrease-on-fail set', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    nonInteractive: true
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    interactive: false,
                })

                expect(loggerMock.warn).toHaveBeenCalledTimes(1)
                expect(loggerMock.warn).toHaveBeenCalledWith('Setting "--non-interactive" has no effect, when "--decrease-on-fail" is not set!')

                expect(config).toEqual(expectedConfig)
            })

            it('should set non-interactive without warning', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    nonInteractive: true,
                    decreaseOnFail: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    interactive: false,
                    onFail: 'decrease',
                })

                expect(loggerMock.warn).toHaveBeenCalledTimes(0)
                expect(config).toEqual(expectedConfig)
            })

            it('should enable debug logging on --debug', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    debug: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    debug: true,
                })

                expect(config).toEqual(expectedConfig)
            })

            it('should set quiet on --quiet', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    quiet: true,
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig = createChromeFullConfig({
                    quiet: true,
                })

                expect(config).toEqual(expectedConfig)
            })

            describe('arch/os', () => {
                it('should do nothing on arch without os', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        arch: 'x86'
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        arch: 'x64'
                    })

                    expect(loggerMock.warn).toHaveBeenCalledTimes(1)
                    expect(loggerMock.warn).toHaveBeenLastCalledWith('Setting "--arch" has no effect, when "--os" is not set!')

                    expect(config).toEqual(expectedConfig)
                })

                it('should set the arch with os also set', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        arch: 'x86',
                        os: 'linux',
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        arch: 'x86',
                        os: 'linux',
                    })

                    expect(loggerMock.warn).toHaveBeenCalledTimes(0)
                    expect(config).toEqual(expectedConfig)
                })

                it('should set os windows', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        os: 'win'
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        os: 'win'
                    })

                    expect(config).toEqual(expectedConfig)
                })

                it('should set os windows with node.js string', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        os: 'win32'
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        os: 'win'
                    })

                    expect(config).toEqual(expectedConfig)
                })

                it('should set os mac', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        os: 'mac'
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        os: 'mac'
                    })

                    expect(config).toEqual(expectedConfig)
                })

                it('should set os mac with node.js string', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        os: 'darwin'
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        os: 'mac'
                    })

                    expect(config).toEqual(expectedConfig)
                })

                // TODO: this should be changed
                it('should fallback to x86 on unknown arch', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        arch: 'foo',
                        os: 'linux',
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeFullConfig({
                        os: 'linux',
                        arch: 'x86',
                    })

                    expect(config).toEqual(expectedConfig)
                })

                it('should throw an error on unknown os', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        os: 'foo' as unknown as OS
                    }))

                    expect(() => {
                        readConfig([''], 'linux')
                    }).toThrow(new Error('unknown OS: foo'))
                })
            })

            describe('single', () => {
                it('should set config single mode', () => {
                    programMock.opts.mockReturnValue(createChromeOptions({
                        arch: 'x64',
                        os: 'win',
                        download: true,
                        single: '10.11.12.13',
                    }))

                    const config = readConfig([''], 'linux')

                    const expectedConfig = createChromeSingleConfig({
                        arch: 'x64',
                        os: 'win',
                        download: true,
                        single: new ComparableVersion(10, 11, 12, 13),
                    })

                    expect(loggerMock.warn).toHaveBeenCalledTimes(0)
                    expect(config).toEqual(expectedConfig)
                })
            })
        })
    })
})
