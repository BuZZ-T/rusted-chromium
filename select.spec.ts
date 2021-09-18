import { MaybeMocked } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import { ComparableVersion } from './commons/ComparableVersion'
import { IMappedVersion } from './interfaces'
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
        const mappedVersion1: IMappedVersion = {
            comparable: new ComparableVersion(10, 0, 0, 0),
            disabled: false,
            value: '10.0.0.0',
        }

        const mappedVersion2: IMappedVersion = {
            comparable: new ComparableVersion(60, 1, 2, 3),
            disabled: false,
            value: '60.1.2.3',
        }

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
        const mappedVersion1: IMappedVersion = {
            comparable: new ComparableVersion(10, 0, 0, 0),
            disabled: false,
            value: '10.0.0.0',
        }

        const mappedVersion2: IMappedVersion = {
            comparable: new ComparableVersion(60, 1, 2, 3),
            disabled: false,
            value: '60.1.2.3',
        }

        const config = createChromeConfig({
            results: 1,
            onlyNewestMajor: false,
        })

        expect(await userSelectedVersion([mappedVersion1, mappedVersion2], config)).toEqual(mappedVersion1)
        expect(promptsMock).toHaveBeenCalledTimes(0)
    })

    it('should filter out not-newest major versions on --only-newest-major', async () => {
        const mappedVersion10: IMappedVersion = {
            comparable: new ComparableVersion(10, 0, 0, 0),
            disabled: false,
            value: '10.0.0.0',
        }
        const mappedVersion10_2: IMappedVersion = {
            comparable: new ComparableVersion(10, 0, 0, 1),
            disabled: false,
            value: '10.0.0.1',
        }

        const mappedVersion60: IMappedVersion = {
            comparable: new ComparableVersion(60, 1, 2, 3),
            disabled: false,
            value: '60.1.2.3',
        }

        const mappedVersion60_2: IMappedVersion = {
            comparable: new ComparableVersion(60, 1, 2, 104),
            disabled: false,
            value: '60.1.2.104',
        }

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
        const mappedVersion10: IMappedVersion = {
            comparable: new ComparableVersion(10, 0, 0, 0),
            disabled: false,
            value: '10.0.0.0',
        }
        const mappedVersion20: IMappedVersion = {
            comparable: new ComparableVersion(20, 0, 0, 1),
            disabled: false,
            value: '20.0.0.1',
        }

        const mappedVersion40: IMappedVersion = {
            comparable: new ComparableVersion(40, 1, 2, 3),
            disabled: false,
            value: '40.1.2.3',
        }

        const mappedVersion60: IMappedVersion = {
            comparable: new ComparableVersion(60, 1, 2, 104),
            disabled: false,
            value: '60.1.2.104',
        }

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
})
