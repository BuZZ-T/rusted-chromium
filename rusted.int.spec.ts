/**
 * Integration tests
 * 
 * @group int
 */

import { readdirSync } from 'fs'
/* eslint-disable-next-line import/no-namespace */
import * as mockFs from 'mock-fs'
import { resolve } from 'path'

import { downloadChromium } from './download'
import { mockAllFetches } from './test/int.utils'
import { createStore, createChromeConfig } from './test/test.utils'

jest.mock('./api')

describe('[int] ...', () => {

    beforeEach(() => {
        mockAllFetches()

        mockFs({
            'localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            'node_modules': mockFs.load(resolve(__dirname, './node_modules')),
            '/tmp/jest_rs': mockFs.load(resolve(__dirname, '/tmp/jest_rs')),
        })
    })

    it('should download a chrome file with --results=1 and --non-interactive', async () => {
        await downloadChromium(createChromeConfig({
            results: 1,
            interactive: false,
        }))

        const chromeFilename = readdirSync(__dirname).find(file => file.startsWith('chrome'))
        expect(chromeFilename).toEqual('chrome-linux-x64-10.0.0.0.zip')
    })
})