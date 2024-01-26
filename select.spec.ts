/**
 * Tests select file
 *
 * @group unit/file/select
 */

import { MappedVersion } from './commons/MappedVersion'
import { logger } from './log/logger'
import { Release } from './releases/release.types'
import { userSelectedVersion } from './select'
import { createChromeFullConfig } from './test/test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('prompts')
jest.mock('./log/logger')

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
        const mappedRelease1: Release = {
            branchPosition: 123,
            version: new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            }),
        }

        const mappedRelease2: Release = {
            branchPosition: 456,
            version: new MappedVersion({
                major: 60,
                minor: 1,
                branch: 2,
                patch: 3,
                disabled: false
            }),
        }

        promptsMock.mockReturnValue({ version: '10.0.0.0' })
        const config = createChromeFullConfig({
            results: 10,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedRelease1, mappedRelease2], config)).toEqual(mappedRelease1)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [mappedRelease1.version, mappedRelease2.version],
            hint: `for ${config.os} ${config.arch}`
        })
        expect(loggerMock.warn).toHaveBeenCalledTimes(0)
    })

    it('should automatically select the first entry on config.results === 1', async () => {
        const mappedRelease1: Release = {
            branchPosition: 123,
            version: new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            }),
        }

        const mappedRelease2: Release = {
            branchPosition: 456,
            version: new MappedVersion({
                major: 60,
                minor: 1,
                branch: 2,
                patch: 3,
                disabled: false
            }),
        }

        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedRelease1, mappedRelease2], config)).toEqual(mappedRelease1)
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(0)
    })

    it('should return null on config.results === 1 with no version', async () => {
        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([], config)).toBeNull()
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')
    })

    it('should return null on config.results === 1 with version disabled', async () => {
        const mappedRelease1: Release = {
            branchPosition: 123,
            version: new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: true
            }),
        }

        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedRelease1], config)).toBeNull()
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')

    })

    it('should return null with all versions disabled', async () => {
        const mappedRelease1: Release = {
            branchPosition: 123,
            version: new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: true
            }),
        }

        const mappedRelease2: Release = {
            branchPosition: 456,
            version: new MappedVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: true
            }),
        }

        const config = createChromeFullConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedRelease1, mappedRelease2], config)).toBeNull()
        expect(promptsMock).toHaveBeenCalledTimes(0)
        expect(loggerMock.warn).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('All versions in the range are disabled, try a different range and amount!')
    })
})
