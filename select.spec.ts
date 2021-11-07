import type { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { MappedVersion } from './commons/MappedVersion'
import { userSelectedVersion } from './select'
import { createChromeConfig } from './test.utils'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const prompts = require('prompts')

jest.mock('prompts')

describe('userSelectedVersion', () => {
    let promptsMock: MaybeMocked<typeof prompts>

    beforeEach(() => {
        promptsMock = mocked(prompts)
        promptsMock.mockClear()
    })

    it('should select the vesion received by prompts', async () => {
        const mappedVersion1 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: false
        })
        const mappedVersion2 = new MappedVersion({
            major: 60,
            minor: 1,
            branch: 2,
            patch: 3,
            disabled: false
        })

        promptsMock.mockReturnValue({ version: '10.0.0.0' })
        const config = createChromeConfig({
            results: 10,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedVersion1, mappedVersion2], config)).toEqual(mappedVersion1)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [mappedVersion1, mappedVersion2],
            hint: `for ${config.os} ${config.arch}`
        })
    })

    it('should automatically select the first entry on config.results === 1', async () => {
        const mappedVersion1 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: false
        })
        const mappedVersion2 = new MappedVersion({
            major: 60,
            minor: 1,
            branch: 2,
            patch: 3,
            disabled: false
        })

        const config = createChromeConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedVersion1, mappedVersion2], config)).toEqual(mappedVersion1)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should return null on config.results === 1 with no version', async () => {
        const config = createChromeConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([], config)).toEqual(null)
    })

    it('should return null on config.results === 1 with version disabled', async () => {
        const mappedVersion1 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: true
        })

        const config = createChromeConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedVersion1], config)).toEqual(null)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should filter out not-newest major versions on --only-newest-major', async () => {
        const mappedVersion10 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: false
        })
        const mappedVersion10_2 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 1,
            disabled: false
        })
        const mappedVersion60 = new MappedVersion({
            major: 60,
            minor: 1,
            branch: 2,
            patch: 3,
            disabled: false
        })
        const mappedVersion60_2 = new MappedVersion({
            major: 60,
            minor: 1,
            branch: 2,
            patch: 104,
            disabled: false
        })

        promptsMock.mockReturnValue({ version: '10.0.0.0' })
        const config = createChromeConfig({
            results: 10,
            onlyNewestMajor: true,
        })

        await userSelectedVersion([mappedVersion60_2, mappedVersion60, mappedVersion10_2, mappedVersion10], config)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [mappedVersion60_2, mappedVersion10_2],
            hint: `for ${config.os} ${config.arch}`
        })
    })

    it('should strip the amount of versions passed to prompts on --only-newest-major', async () => {
        const mappedVersion10 = new MappedVersion({
            major: 10,
            minor: 0,
            branch: 0,
            patch: 0,
            disabled: false
        })
        const mappedVersion20 = new MappedVersion({
            major: 20,
            minor: 0,
            branch: 0,
            patch: 1,
            disabled: false
        })
        const mappedVersion40 = new MappedVersion({
            major: 40,
            minor: 1,
            branch: 2,
            patch: 3,
            disabled: false
        })
        const mappedVersion60 = new MappedVersion({
            major: 60,
            minor: 1,
            branch: 2,
            patch: 104,
            disabled: false
        })

        promptsMock.mockReturnValue({ version: '10.0.0.0' })
        const config = createChromeConfig({
            results: 3,
            onlyNewestMajor: true,
        })

        await userSelectedVersion([mappedVersion60, mappedVersion40, mappedVersion20, mappedVersion10], config)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [mappedVersion60, mappedVersion40, mappedVersion20],
            hint: `for ${config.os} ${config.arch}`
        })
    })

    it('should select the next version is newest major is disabled on --only-newest-major', async () => {
        const mappedVersion20 = new MappedVersion(10, 0, 0, 0, false)
        const mappedVersion201 = new MappedVersion(20, 0, 0, 1, true)

        const config = createChromeConfig({
            onlyNewestMajor: true,
            results: 2,
        })

        await userSelectedVersion([mappedVersion20, mappedVersion201], config)
        expect(promptsMock).toHaveBeenCalledWith({
            type: 'select',
            name: 'version',
            message: 'Select a version',
            warn: 'This version seems to not have a binary',
            choices: [mappedVersion20],
            hint: `for ${config.os} ${config.arch}`
        })
    })

})
