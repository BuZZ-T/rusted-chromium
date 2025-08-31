/**
 * Integration tests for downloading chromium
 *
 * @group int/test/output
 */

/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
/* eslint-disable-next-line import/no-namespace */
import * as fetch from 'node-fetch'
import { unlink } from 'node:fs/promises'
import { join as pathJoin, resolve } from 'node:path'
/* eslint-disable-next-line import/no-namespace */
import * as prompts from 'prompts'
import { DebugMode, logger, progress, spinner, table } from 'yalpt'

import { ComparableVersion, rusted } from '../public_api'
import { chromeZipStream, getJestTmpFolder, mockNodeFetch } from '../test/int.utils'
/* eslint-disable-next-line import/no-namespace */
import { existsAndIsFile } from '../utils/file.utils'

jest.mock('node-fetch')
const nodeFetchMock = jest.mocked(fetch)

jest.mock('prompts')
const promptsMock = jest.mocked(prompts)

jest.mock('yalpt')
const loggerMock = jest.mocked(logger)
const spinnerMock = jest.mocked(spinner)
const tableMock = jest.mocked(table)
const progressMock = jest.mocked(progress)

describe('[int] logging ouput', () => {
    const chromeZip10 = pathJoin(__dirname, '../', 'chrome-linux-x64-10.0.0.0.zip')
    const chromeZip20 = pathJoin(__dirname, '../', 'chrome-linux-x64-20.0.0.0.zip')

    beforeAll(async () => {
        const jestFolder = await getJestTmpFolder()
        mockFs({
            // pass some folders to the mock for jest to be able to run
            './node_modules': mockFs.load(resolve(__dirname, '../node_modules')),
            [`/tmp/${jestFolder}`]: mockFs.load(resolve(`/tmp/${jestFolder}`)),
        })
    })

    beforeEach(async () => {
        // clear mock-fs
        if (await existsAndIsFile(chromeZip10)) {
            await unlink(chromeZip10)
        }
        if (await existsAndIsFile(chromeZip20)) {
            await unlink(chromeZip20)
        }

        mockNodeFetch(nodeFetchMock, {
            params: {
                releases: ['10.0.0.0', '20.0.0.0']
            },
            config: {
                chromeZip: {
                    contentLength: 20,
                }
            }
        })

        promptsMock.mockClear()
    })

    it('should do nothing on default', async () => {
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(loggerMock.silent).not.toHaveBeenCalled()
        expect(spinnerMock.silent).not.toHaveBeenCalled()
        expect(tableMock.silent).not.toHaveBeenCalled()
        expect(progressMock.silent).not.toHaveBeenCalled()

        expect(loggerMock.setDebugMode).not.toHaveBeenCalled()

        expect(loggerMock.noProgress).not.toHaveBeenCalled()
        expect(spinnerMock.noProgress).not.toHaveBeenCalled()
        expect(tableMock.noProgress).not.toHaveBeenCalled()
        expect(progressMock.noProgress).not.toHaveBeenCalled()

        expect(loggerMock.noColor).not.toHaveBeenCalled()
        expect(spinnerMock.noColor).not.toHaveBeenCalled()
        expect(tableMock.noColor).not.toHaveBeenCalled()
        expect(progressMock.noColor).not.toHaveBeenCalled()
    })

    it('should silent the output', async () => {
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--quiet'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(loggerMock.silent).toHaveBeenCalled()
        expect(spinnerMock.silent).toHaveBeenCalled()
        expect(tableMock.silent).toHaveBeenCalled()
        expect(progressMock.silent).toHaveBeenCalled()
    })

    it('should set the debug mode', async () => {
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--debug'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(loggerMock.setDebugMode).toHaveBeenCalledWith(DebugMode.DEBUG)
    })

    it('should set no-progress', async () => {
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--no-progress'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(loggerMock.noProgress).toHaveBeenCalled()
        expect(spinnerMock.noProgress).toHaveBeenCalled()
        expect(tableMock.noProgress).toHaveBeenCalled()
        expect(progressMock.noProgress).toHaveBeenCalled()
    })

    it('should set no-color', async () => {
        promptsMock.mockResolvedValue({ version: new ComparableVersion('20.0.0.0') })

        const rustedPromise = rusted(['/some/path/to/node', '/some/path/to/rusted-chromium', '--no-color'], 'linux')

        chromeZipStream.end()

        await rustedPromise

        expect(loggerMock.noColor).toHaveBeenCalled()
        expect(spinnerMock.noColor).toHaveBeenCalled()
        expect(tableMock.noColor).toHaveBeenCalled()
        expect(progressMock.noColor).toHaveBeenCalled()
    })
})
