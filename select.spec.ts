import { mocked } from 'ts-jest/utils'
import * as prompts from 'prompts'

import { IMappedVersion } from './interfaces'
import { createChromeConfig } from './test.utils'
import { userSelectedVersion } from './select'

jest.mock('prompts')

describe('userSelectedVersion', () => {
    let promptsMock: any

    beforeEach(() => {
        promptsMock = mocked(prompts)
        promptsMock.mockClear()
    })

    it('should select the vesion received by prompts', async () => {
        const mappedVersion1: IMappedVersion = {
            comparable: 10_00_00000_0000,
            disabled: false,
            value: '10.0.0.0',
        }

        const mappedVersion2: IMappedVersion = {
            comparable: 60_01_00002_0003,
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
            comparable: 10_00_00000_0000,
            disabled: false,
            value: '10.0.0.0',
        }

        const mappedVersion2: IMappedVersion = {
            comparable: 60_01_00002_0003,
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
            comparable: 10_00_00000_0000,
            disabled: false,
            value: '10.0.0.0',
        }
        const mappedVersion10_2: IMappedVersion = {
            comparable: 10_00_00000_0001,
            disabled: false,
            value: '10.0.0.1',
        }

        const mappedVersion60: IMappedVersion = {
            comparable: 60_01_00002_0003,
            disabled: false,
            value: '60.1.2.3',
        }

        const mappedVersion60_2: IMappedVersion = {
            comparable: 60_01_00002_0104,
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

    it('should strip the amount of versions passed to prompts on --only-newest-major ', async () => {
        const mappedVersion10: IMappedVersion = {
            comparable: 10_00_00000_0000,
            disabled: false,
            value: '10.0.0.0',
        }
        const mappedVersion20: IMappedVersion = {
            comparable: 20_00_00000_0001,
            disabled: false,
            value: '20.0.0.1',
        }

        const mappedVersion40: IMappedVersion = {
            comparable: 40_01_00002_0003,
            disabled: false,
            value: '40.1.2.3',
        }

        const mappedVersion60: IMappedVersion = {
            comparable: 60_01_00002_0104,
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
