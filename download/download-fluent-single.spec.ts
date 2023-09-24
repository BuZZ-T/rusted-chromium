/**
 * Test download-fluent-single file
 *
 * @group unit/file/download-fluent-single
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { createChromeSingleConfig } from '../test/test.utils'
import { downloadChromium } from './download'
import { FluentDownloadSingleIncomplete } from './download-fluent-single'

jest.mock('./download')

const allFalseSingleConfig = createChromeSingleConfig({
    color: false,
    download: false,
    store: false,
})

describe('download-fluent-single', () => {

    let fluentDownloadSingle: FluentDownloadSingleIncomplete

    let downloadChromiumMock: jest.MaybeMocked<typeof downloadChromium>

    beforeEach(() => {
        downloadChromiumMock = jest.mocked(downloadChromium)

        downloadChromiumMock.mockReset()
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

    it('should call downloadChromium with quiet set', () => {
        fluentDownloadSingle
            .quiet()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            quiet: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should call downloadChromium with store set', () => {
        fluentDownloadSingle
            .store()
            .single('10.0.0.0')
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            store: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })

    it('should set store after setting single', () => {
        fluentDownloadSingle
            .single('10.0.0.0')
            .store()
            .start()

        expect(downloadChromiumMock).toHaveBeenCalledTimes(1)
        expect(downloadChromiumMock).toHaveBeenCalledWith({
            ...allFalseSingleConfig,
            store: true,
            single: new ComparableVersion('10.0.0.0'),
        })
    })
})
