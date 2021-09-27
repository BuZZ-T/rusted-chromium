import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { ComparableVersion } from '../commons/ComparableVersion'
import { IChromeConfigWrapper, OS, IStoreConfigWrapper, IExportConfigWrapper } from '../interfaces'
import { Spinner, logger } from '../log/spinner'
import { createChromeConfig, createChromeOptions } from '../test.utils'
import { DEFAULT_OPTIONS, readConfig } from './config'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const program = require('commander')

jest.mock('commander')
jest.mock('../log/spinner')

describe('config', () => {

    let programMock: MaybeMockedDeep<typeof program>
    let loggerMock: MaybeMockedDeep<Spinner>

    describe('readConfig', () => {

        beforeEach(() => {
            loggerMock = mocked(logger, true)
            loggerMock.warn.mockClear()

            programMock = mocked(program, true)
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

            expect(programMock.parse).toBeCalledTimes(1)
            expect(programMock.parse).toBeCalledTimes(1)

        })

        it('should set min version', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                min: '20',
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    min: new ComparableVersion({
                        branch: 0,
                        major: 20,
                        minor: 0,
                        patch: 0,
                    }),
                    results: Infinity,
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set max version', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                max: '30.0.1234.33',
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    max: new ComparableVersion({
                        branch: 1234,
                        major: 30,
                        minor: 0,
                        patch: 33,
                    }),
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set decrease on fail', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                decreaseOnFail: true,
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    onFail: 'decrease',
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set increase on fail', () => {
            programMock.opts.mockReturnValue({
                ...DEFAULT_OPTIONS,
                increaseOnFail: true,
            })

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    onFail: 'increase',
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set autoUnzip', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                unzip: true,
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    autoUnzip: true,
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set results', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                maxResults: '24',
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    results: 24,
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set no-download', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                download: false,
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    download: false,
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set hide negative hits', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                hideNegativeHits: true,
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    hideNegativeHits: true,
                })
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should warn on non-interactive without decrease-on-fail set', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                nonInteractive: true
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    interactive: false,
                })
            }

            expect(loggerMock.warn).toBeCalledTimes(1)
            expect(loggerMock.warn).toHaveBeenCalledWith('Setting "--non-interactive" has no effect, when "--decrease-on-fail" is not set!')

            expect(config).toEqual(expectedConfig)
        })

        it('should set non-interactive without warning', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                nonInteractive: true,
                decreaseOnFail: true,
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IChromeConfigWrapper = {
                action: 'loadChrome',
                config: createChromeConfig({
                    interactive: false,
                    onFail: 'decrease',
                })
            }

            expect(loggerMock.warn).toBeCalledTimes(0)
            expect(config).toEqual(expectedConfig)
        })

        it('should set importStore', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                importStore: 'some-url',
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IStoreConfigWrapper = {
                action: 'importStore',
                config: {
                    url: 'some-url'
                }
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set exportStore without path', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                exportStore: true
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IExportConfigWrapper = {
                action: 'exportStore',
                config: {}
            }

            expect(config).toEqual(expectedConfig)
        })

        it('should set exportStore with path', () => {
            programMock.opts.mockReturnValue(createChromeOptions({
                exportStore: 'some-path'
            }))

            const config = readConfig([''], 'linux')

            const expectedConfig: IExportConfigWrapper = {
                action: 'exportStore',
                config: {
                    path: 'some-path'
                }
            }
            
            expect(config).toEqual(expectedConfig)
        })

        describe('arch/os', () => {
            it('should do nothing on arch without os', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    arch: 'x86'
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        arch: 'x64'
                    })
                }

                expect(loggerMock.warn).toBeCalledTimes(1)
                expect(loggerMock.warn).toHaveBeenLastCalledWith('Setting "--arch" has no effect, when "--os" is not set!')

                expect(config).toEqual(expectedConfig)
            })

            it('should set the arch with os also set', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    arch: 'x86',
                    os: 'linux',
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        arch: 'x86',
                        os: 'linux',
                    })
                }

                expect(loggerMock.warn).toBeCalledTimes(0)
                expect(config).toEqual(expectedConfig)
            })

            it('should set os windows', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    os: 'win'
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        os: 'win'
                    })
                }

                expect(config).toEqual(expectedConfig)
            })

            it('should set os windows with node.js string', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    os: 'win32'
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        os: 'win'
                    })
                }

                expect(config).toEqual(expectedConfig)
            })

            it('should set os mac', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    os: 'mac'
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        os: 'mac'
                    })
                }

                expect(config).toEqual(expectedConfig)
            })

            it('should set os mac with node.js string', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    os: 'darwin'
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        os: 'mac'
                    })
                }

                expect(config).toEqual(expectedConfig)
            })

            // TODO: this should be changed
            it('should fallback to x86 on unknown arch', () => {
                programMock.opts.mockReturnValue(createChromeOptions({
                    arch: 'foo',
                    os: 'linux',
                }))

                const config = readConfig([''], 'linux')

                const expectedConfig: IChromeConfigWrapper = {
                    action: 'loadChrome',
                    config: createChromeConfig({
                        os: 'linux',
                        arch: 'x86',
                    })
                }

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
    })
})
