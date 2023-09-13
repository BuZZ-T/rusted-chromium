/**
 * Test download-fluent file
 * 
 * @group unit/file/download-fluent
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { createChromeFullConfig } from '../test/test.utils'
import { downloadChromium } from './download'
import { FluentDownload } from './download-fluent'

jest.mock('./download')

const allFalseConfig = createChromeFullConfig({
    color: false,
    download: false,
    interactive: false,
    max: new ComparableVersion(Infinity, 0, 0, 0),
    min: new ComparableVersion(-Infinity, 0, 0, 0),
    results: Infinity,
    store: false,
})

describe('download-fluent', () => {

    let fluentDownload: FluentDownload
    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>
    
    beforeEach(() => {
        fluentDownload = new FluentDownload()
        downloadChromiumMock = jest.mocked(downloadChromium)

        downloadChromiumMock.mockReset()
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

    it('should call downloadChromium with quiet set', () => {
        fluentDownload
            .quiet()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            quiet: true,
        })
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

    it('should call downloadChromium with store set', () => {
        fluentDownload
            .store()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseConfig,
            store: true,
        })
    })
})
