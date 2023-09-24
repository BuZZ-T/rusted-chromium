/**
 * Integration tests for the API to download chromium
 *
 * @group int/api/downloadChromium
 */

/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { writeFile, unlink } from 'node:fs/promises'
import { join as pathJoin, resolve } from 'node:path'

import { ComparableVersion } from '../commons/ComparableVersion'
import { mockNodeFetch, chromeZipStream, getJestTmpFolder } from '../test/int.utils'
import { createStore } from '../test/test.utils'
import { existsAndIsFile } from '../utils/file.utils'
import { downloadChromium } from './download'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('node-fetch', () => jest.fn())
jest.mock('prompts')

describe('[int] download API', () => {
    const chromeZip10 = pathJoin(__dirname, '../', 'chrome-linux-x64-10.0.0.0.zip')
    const chromeZip20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0.zip')
    const localStoreFile = pathJoin(__dirname, '../', 'localstore.json')

    let promptsMock: jest.MaybeMocked<typeof prompts>
    let nodeFetchMock: jest.MaybeMocked<typeof fetch>

    beforeAll(async () => {
        promptsMock = jest.mocked(prompts)

        const jestFolder = await getJestTmpFolder()
        mockFs({
            '../localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            './node_modules': mockFs.load(resolve(__dirname, '../node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(resolve(`/tmp/${jestFolder}`)),
        })
    })

    beforeEach(async () => {
        // clear mock-fs
        await writeFile(localStoreFile, JSON.stringify(createStore()))
        if (await existsAndIsFile(chromeZip10)) {
            await unlink(chromeZip10)
        }
        if (await existsAndIsFile(chromeZip20)) {
            await unlink(chromeZip20)
        }

        nodeFetchMock = jest.mocked(fetch)
        mockNodeFetch(nodeFetchMock, {
            config: {
                chromeZip: {
                    contentLength: 20,
                }
            }
        })

        promptsMock.mockClear()
    })

    afterAll(() => {
        mockFs.restore()
    })

    it('should download all settings set { results: 1 }', async () => {
        const downloadPromise = downloadChromium({
            arch: 'x64',
            autoUnzip: false,
            color: true,
            download: true,
            hideNegativeHits: false,
            interactive: true,
            inverse: false,
            max: new ComparableVersion(95, 0, 0, 0),
            min: new ComparableVersion(0,0,0,0),
            onFail: 'nothing',
            onlyNewestMajor: false,
            os: 'linux',
            quiet: false,
            store: true,
            results: 1,
            downloadFolder: null,
            single: null,
            debug: false,
            list: false,
        })

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await downloadPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)
    })

    it('should download with default settings and { results: 1 }', async () => {
        const downloadPromise = downloadChromium.withDefaults({ results: 1 })

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await downloadPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)
    })

    it('should download with fluent interface and { results: 1 }', async () => {
        const downloadPromise = downloadChromium.with
            .arch('x64')
            .os('linux')
            .download()
            .results(1)
            .store()
            .start()

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await downloadPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)
    })

    it('should download single with fluent interface', async () => {
        const downloadPromise = downloadChromium.withSingle
            .arch('x64')
            .os('linux')
            .download()
            .store()
            .single(new ComparableVersion('10.0.0.0'))
            .start()

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await downloadPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(true)
        expect(await existsAndIsFile(chromeZip20)).toBe(false)
    })

    it('should download single as string with fluent interface', async () => {
        const downloadPromise = downloadChromium.withSingle
            .arch('x64')
            .os('linux')
            .download()
            .store()
            .single('20.0.0.0')
            .start()

        chromeZipStream.push('asdf')
        chromeZipStream.end()

        await downloadPromise

        expect(await existsAndIsFile(chromeZip10)).toBe(false)
        expect(await existsAndIsFile(chromeZip20)).toBe(true)
    })
})