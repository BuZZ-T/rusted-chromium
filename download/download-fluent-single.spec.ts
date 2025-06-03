/**
 * Test download-fluent-single file
 *
 * @group unit/file/download-fluent-single
 */

import { logger, progress, spinner } from 'yalpt'

import { downloadChromium } from './download'
import { FluentDownloadSingleIncomplete } from './download-fluent-single'
import { ComparableVersion } from '../commons/ComparableVersion'
import { createChromeSingleConfig } from '../test/test.utils'

jest.mock('./download')
jest.mock('yalpt')

const allFalseSingleConfig = createChromeSingleConfig({
    download: false,
})

const downloadChromiumMock = jest.mocked(downloadChromium)
const loggerMock = jest.mocked(logger)
const spinnerMock = jest.mocked(spinner)
const progressMock = jest.mocked(progress)

describe('download-fluent-single', () => {

    let fluentDownloadSingle: FluentDownloadSingleIncomplete

    beforeEach(() => {

        downloadChromiumMock.mockReset()
        loggerMock.silent = jest.fn()
        spinnerMock.silent = jest.fn()
        progressMock.silent = jest.fn()

        loggerMock.noColor = jest.fn()
        spinnerMock.noColor = jest.fn()
        progressMock.noColor = jest.fn()

        loggerMock.noProgress = jest.fn()
        spinnerMock.noProgress = jest.fn()
        progressMock.noProgress = jest.fn()

        fluentDownloadSingle = new FluentDownloadSingleIncomplete()
    })

    it('should call downloadChromium with the default values', () => {
        fluentDownloadSingle
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with the default values as ComparableVersion', () => {
        fluentDownloadSingle
            .single(new ComparableVersion('10.0.0.0'))
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with arch set', () => {
        fluentDownloadSingle
            .arch('arm')
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            arch: 'arm',
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with autoUnzip set', () => {
        fluentDownloadSingle
            .autoUnzip()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            autoUnzip: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with debug set', () => {
        fluentDownloadSingle
            .debug()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            debug: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with download set', () => {
        fluentDownloadSingle
            .download()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            download: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with downloadFolder set', () => {
        fluentDownloadSingle
            .downloadFolder('d-fold')
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            downloadFolder: 'd-fold',
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with os set', () => {
        fluentDownloadSingle
            .os('win')
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            os: 'win',
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should silent the loggers with quiet set', () => {
        fluentDownloadSingle
            .quiet()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            single: new ComparableVersion('10.0.0.0'),
        })
        expect(loggerMock.silent).toHaveBeenCalledTimes(1)
        expect(loggerMock.silent).toHaveBeenCalledWith()
        expect(progressMock.silent).toHaveBeenCalledTimes(1)
        expect(progressMock.silent).toHaveBeenCalledWith()
        expect(spinnerMock.silent).toHaveBeenCalledTimes(1)
        expect(spinnerMock.silent).toHaveBeenCalledWith()
    })

    it('should noColor the loggers with noColor set', () => {
        fluentDownloadSingle
            .noColor()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
        })
        expect(loggerMock.noColor).toHaveBeenCalledTimes(1)
        expect(loggerMock.noColor).toHaveBeenCalledWith()
        expect(progressMock.noColor).toHaveBeenCalledTimes(1)
        expect(progressMock.noColor).toHaveBeenCalledWith()
        expect(spinnerMock.noColor).toHaveBeenCalledTimes(1)
        expect(spinnerMock.noColor).toHaveBeenCalledWith()
    })

    it('should noProgress the loggers with noProgress set', () => {
        fluentDownloadSingle
            .noProgress()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            single: new ComparableVersion('10.0.0.0'),
        })
        expect(loggerMock.noProgress).toHaveBeenCalledTimes(1)
        expect(loggerMock.noProgress).toHaveBeenCalledWith()
        expect(progressMock.noProgress).toHaveBeenCalledTimes(1)
        expect(progressMock.noProgress).toHaveBeenCalledWith()
        expect(spinnerMock.noProgress).toHaveBeenCalledTimes(1)
        expect(spinnerMock.noProgress).toHaveBeenCalledWith()
    })
})
