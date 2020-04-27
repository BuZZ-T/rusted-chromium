import { MaybeMockedDeep } from 'ts-jest/dist/util/testing'
import { mocked } from 'ts-jest/utils'

import { detectOperatingSystem, versionToComparableVersion } from './utils';
import { IConfig } from './interfaces'
import { logger, LoggerSpinner } from './loggerSpinner'

jest.mock('./loggerSpinner')

describe('utils', () => {

    let loggerMock: MaybeMockedDeep<LoggerSpinner>

    beforeEach(() => {
        loggerMock = mocked(logger, true)
    })

    const defaultConfig: IConfig = {
        arch: 'x64',
        autoUnzip: true,
        interactive: true,
        max: 0,
        min: 0,
        onFail: 'nothing',
        os: 'linux',
        results: '',
        store: false,
        download: true,
    }

    describe('detectOperatingSystem', () => {
        it('should return linux 64-bit', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'linux',
                arch: 'x64',
            })

            expect(url).toEqual('Linux_x64')
            expect(file).toEqual('linux')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return linux 32-bit', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'linux',
                arch: 'x86',
            })

            expect(url).toEqual('Linux')
            expect(file).toEqual('linux')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return windows 64-bit', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'win',
                arch: 'x64',
            })

            expect(url).toEqual('Win_x64')
            expect(file).toEqual('win')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return windows 32-bit', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'win',
                arch: 'x86',
            })

            expect(url).toEqual('Win')
            expect(file).toEqual('win')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return mac 64-Bit', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'mac',
                arch: 'x64',
            })

            expect(url).toEqual('Mac')
            expect(file).toEqual('mac')
            expect(loggerMock.warn).toHaveBeenCalledTimes(0)
        })

        it('should return mac 64-bit for 32-bit request and logging warning', () => {
            const [url, file] = detectOperatingSystem({
                ...defaultConfig,
                os: 'mac',
                arch: 'x86',
            })

            expect(url).toEqual('Mac')
            expect(file).toEqual('mac')
            expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        })
    })

    describe('versionToComparableVersion', () => {
        it('should', () => {
            expect(versionToComparableVersion('10.0.0.0')).toEqual(10_00_00000_0000)

            expect(versionToComparableVersion('10.0.0.0')).toEqual(10_00_00000_0000)
            expect(versionToComparableVersion('10.10.10.10')).toEqual(10_10_00010_0010)
            expect(versionToComparableVersion('10.0.1000.0')).toEqual(10_00_01000_0000)
            expect(versionToComparableVersion('10.0.0.100')).toEqual(10_00_00000_0100)
            expect(versionToComparableVersion('100.0.0.1')).toEqual(100_00_00000_0001)
        })
    })

})
