/**
 * Integration tests
 * 
 * @group int
 */

import * as fs from 'fs'
import * as mockFs from 'mock-fs'
import * as path from 'path'

import { downloadChromium } from './download'
import { createStore, createChromeConfig } from './test.utils'
import { mockAllFetches } from './test/int.utils'

jest.mock('./api')

describe('[int] ...', () => {

    beforeEach(() => {
        mockAllFetches()

        mockFs({
            'localstore.json': JSON.stringify(createStore()),

            // pass some folders to the mock for jest to be able to run
            'node_modules': mockFs.load(path.resolve(__dirname, './node_modules')),
            '/tmp/jest_rs': mockFs.load(path.resolve(__dirname, '/tmp/jest_rs')),
        })
    })

    it('should download a chrome file with --results=1 and --non-interactive', async () => {
        await downloadChromium(createChromeConfig({
            results: 1,
            interactive: false,
        }))

        const chromeFilename = fs.readdirSync(__dirname).find(file => file.startsWith('chrome'))
        expect(chromeFilename).toEqual('chrome-linux-x64-10.0.0.0.zip')
    })
})