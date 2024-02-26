/**
 * Test download-fluent-single file
 *
 * @group unit/file/download-fluent-single
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { logger } from '../log/logger'
import { progress } from '../log/progress'
import { spinner } from '../log/spinner'
import { createChromeSingleConfig } from '../test/test.utils'
import { downloadChromium } from './download'
import { FluentDownloadSingleIncomplete } from './download-fluent-single'

jest.mock('./download')
jest.mock('../log/logger')
jest.mock('../log/progress')
jest.mock('../log/spinner')

const allFalseSingleConfig = createChromeSingleConfig({
    download: false,
})

describe('download-fluent-single', () => {

    let fluentDownloadSingle: FluentDownloadSingleIncomplete

    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>
    const loggerMock = jest.mocked(logger)
    const spinnerMock = jest.mocked(spinner)
    const progressMock = jest.mocked(progress)

    beforeEach(() => {
        downloadChromiumMock = jest.mocked(downloadChromium)

        downloadChromiumMock.mockReset()
        loggerMock.silent.mockReset()
        spinnerMock.silent.mockReset()
        progressMock.silent.mockReset()

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
        expect(logger.silent).toHaveBeenCalledTimes(1)
        expect(logger.silent).toHaveBeenCalledWith()
        expect(progress.silent).toHaveBeenCalledTimes(1)
        expect(progress.silent).toHaveBeenCalledWith()
        expect(spinner.silent).toHaveBeenCalledTimes(1)
        expect(spinner.silent).toHaveBeenCalledWith()
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
        expect(logger.noColor).toHaveBeenCalledTimes(1)
        expect(logger.noColor).toHaveBeenCalledWith()
        expect(progress.noColor).toHaveBeenCalledTimes(1)
        expect(progress.noColor).toHaveBeenCalledWith()
        expect(spinner.noColor).toHaveBeenCalledTimes(1)
        expect(spinner.noColor).toHaveBeenCalledWith()
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
        expect(logger.noProgress).toHaveBeenCalledTimes(1)
        expect(logger.noProgress).toHaveBeenCalledWith()
        expect(progress.noProgress).toHaveBeenCalledTimes(1)
        expect(progress.noProgress).toHaveBeenCalledWith()
        expect(spinner.noProgress).toHaveBeenCalledTimes(1)
        expect(spinner.noProgress).toHaveBeenCalledWith()
    })
})
