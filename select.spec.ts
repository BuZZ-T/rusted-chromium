/**
 * Tests select file
 *
 * @group unit/file/select
 */

import { logger } from 'yalpt'

import { ComparableVersion } from './commons/ComparableVersion'
import type { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
import { createChromeFullConfig } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const prompts = require('prompts')

jest.mock('prompts')
jest.mock('yalpt')

describe('userSelectedVersion', () => {
    let promptsMock: jest.MaybeMocked<typeof prompts>
    let loggerMock: jest.MaybeMockedDeep<typeof logger>

    beforeEach(() => {
        promptsMock = jest.mocked(prompts)
        promptsMock.mockClear()

        loggerMock = jest.mocked(logger)
        loggerMock.warn.mockClear()
    })

    it('should select the vesion received by prompts', async () => {
        const release1: Release = {
            branchPosition: 123,
            version: new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            }),
        }

        const release2: Release = {
            branchPosition: 456,
            version: new ComparableVersion({
                major: 60,
                minor: 1,
                branch: 2,
                patch: 3,
            }),
        }

        promptsMock.mockReturnValue({ version: release1.version })
        const config = createChromeFullConfig({
            results: 10,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([release1, release2], config, new Set())).toEqual(release1)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [
                {
                    title: release1.version.toString(),
                    value: release1.version,
                    disabled: false,
                },
                {
                    title: release2.version.toString(),
                    value: release2.version,
                    disabled: false,
                }
            ],
            hint: `for ${config.os} ${config.arch}`
        })
        expect(loggerMock.warn).toHaveBeenCalledTimes(0)
    })

    it('should automatically select the first entry on config.results === 1', async () => {
        const mappedRelease1: Release = {
            branchPosition: 123,
            version: new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            }),
        }

        const mappedRelease2: Release = {
            branchPosition: 456,
            version: new ComparableVersion({
                major: 60,
                minor: 1,
                branch: 2,
                patch: 3,
            }),
        }

        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedRelease1, mappedRelease2], config, new Set())).toEqual(mappedRelease1)
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(0)
    })

    it('should return null on config.results === 1 with no version', async () => {
        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([], config, new Set())).toBeNull()
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')
    })

    it('should return null on config.results === 1 with version disabled', async () => {
        const release1: Release = {
            branchPosition: 123,
            version: new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            }),
        }

        const config = createChromeFullConfig({
            hideNegativeHits: true,
            onlyNewestMajor: false,
            results: 1,
        })

        expect(await userSelectedVersion([release1], config, new Set([release1.version]))).toBeNull()
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')

    })

    it('should return null with all versions disabled', async () => {
        const release1: Release = {
            branchPosition: 123,
            version: new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            }),
        }

        const release2: Release = {
            branchPosition: 456,
            version: new ComparableVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
            }),
        }

        const config = createChromeFullConfig({
            hideNegativeHits: true,
            onlyNewestMajor: false,
            results: 1,
        })

        expect(await userSelectedVersion([release1, release2], config, new Set([release1.version, release2.version]))).toBeNull()
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')
    })
})
