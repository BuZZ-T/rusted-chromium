/**
 * Test download-fluent file
 *
 * @group unit/file/download-fluent
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { logger } from '../log/logger'
import { progress } from '../log/progress'
import { spinner } from '../log/spinner'
import { createChromeFullConfig } from '../test/test.utils'
import { downloadChromium } from './download'
import { FluentDownload } from './download-fluent'

jest.mock('./download')
jest.mock('../log/logger')
jest.mock('../log/progress')
jest.mock('../log/spinner')

const allFalseConfig = createChromeFullConfig({
    download: false,
    interactive: false,
    max: new ComparableVersion(Infinity, 0, 0, 0),
    min: new ComparableVersion(-Infinity, 0, 0, 0),
    results: Infinity,
})

describe('download-fluent', () => {

    let fluentDownload: FluentDownload
    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>
    const loggerMock = jest.mocked(logger)
    const progressMock = jest.mocked(progress)
    const spinnerMock = jest.mocked(spinner)

    beforeEach(() => {
        fluentDownload = new FluentDownload()
        downloadChromiumMock = jest.mocked(downloadChromium)

        downloadChromiumMock.mockReset()

        loggerMock.silent.mockReset()
        progressMock.silent.mockReset()
        spinnerMock.silent.mockReset()
    })

    it('should call downloadChromium with the default values', () => {
        fluentDownload.start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith(allFalseConfig)
    })

    it('should call downloadChromium with arch set', () => {
        fluentDownload
            .arch('x86')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            arch: 'x86',
        })
    })

    it('should call downloadChromium with autoUnzip set', () => {
        fluentDownload
            .autoUnzip()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            autoUnzip: true,
        })
    })

    it('should call downloadChromium with debug set', () => {
        fluentDownload
            .debug()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            debug: true,
        })
    })

    it('should call downloadChromium with download set', () => {
        fluentDownload
            .download()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            download: true,
        })
    })

    it('should call downloadChromium with downloadFolder set', () => {
        fluentDownload
            .downloadFolder('d-f')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            downloadFolder: 'd-f',
        })
    })

    it('should call downloadChromium with hideNegativeHits set', () => {
        fluentDownload
            .hideNegativeHits()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            hideNegativeHits: true,
        })
    })

    it('should call downloadChromium with interactive set', () => {
        fluentDownload
            .interactive()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            interactive: true,
        })
    })

    it('should call downloadChromium with inverse set', () => {
        fluentDownload
            .inverse()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            inverse: true,
        })
    })

    it('should call downloadChromium with max set', () => {
        fluentDownload
            .max('100.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            max: new ComparableVersion('100.0.0.0'),
        })
    })

    it('should call downloadChromium with max set as ComparableVersion', () => {
        fluentDownload
            .max(new ComparableVersion('100.0.0.0'))
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            max: new ComparableVersion('100.0.0.0'),
        })
    })

    it('should call downloadChromium with min set', () => {
        fluentDownload
            .min('1.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            min: new ComparableVersion('1.0.0.0'),
        })
    })

    it('should call downloadChromium with min set as ComparableVersion', () => {
        fluentDownload
            .min(new ComparableVersion('1.0.0.0'))
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            min: new ComparableVersion('1.0.0.0'),
        })
    })

    it('should call downloadChromium with onFail set', () => {
        fluentDownload
            .onFail('decrease')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            onFail: 'decrease',
        })
    })

    it('should call downloadChromium with onlyNewestMajor set', () => {
        fluentDownload
            .onlyNewestMajor()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            onlyNewestMajor: true,
        })
    })

    it('should call downloadChromium with os set', () => {
        fluentDownload
            .os('win')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            os: 'win',
        })
    })

    it('should silent the loggers with quiet set', () => {
        fluentDownload
            .quiet()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
        })
        expect(logger.silent).toHaveBeenCalledTimes(1)
        expect(logger.silent).toHaveBeenCalledWith()
        expect(progress.silent).toHaveBeenCalledTimes(1)
        expect(progress.silent).toHaveBeenCalledWith()
        expect(spinner.silent).toHaveBeenCalledTimes(1)
        expect(spinner.silent).toHaveBeenCalledWith()
    })

    it('should noColor the loggers with noColor set', () => {
        fluentDownload
            .noColor()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
        })
        expect(logger.noColor).toHaveBeenCalledTimes(1)
        expect(logger.noColor).toHaveBeenCalledWith()
        expect(progress.noColor).toHaveBeenCalledTimes(1)
        expect(progress.noColor).toHaveBeenCalledWith()
        expect(spinner.noColor).toHaveBeenCalledTimes(1)
        expect(spinner.noColor).toHaveBeenCalledWith()
    })

    it('should noProgress the loggers with noProgress set', () => {
        fluentDownload
            .noProgress()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
        })
        expect(logger.noProgress).toHaveBeenCalledTimes(1)
        expect(logger.noProgress).toHaveBeenCalledWith()
        expect(progress.noProgress).toHaveBeenCalledTimes(1)
        expect(progress.noProgress).toHaveBeenCalledWith()
        expect(spinner.noProgress).toHaveBeenCalledTimes(1)
        expect(spinner.noProgress).toHaveBeenCalledWith()
    })

    it('should call downloadChromium with results set', () => {
        fluentDownload
            .results(5)
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            results: 5,
        })
    })
})
