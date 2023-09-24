/**
 * Tests utils file
 *
 * @group unit/file/utils
 */

import type { IOSSettings, OS } from './interfaces/os.interfaces'
import { createChromeFullConfig } from './test/test.utils'
import { detectOperatingSystem, waitFor, popArray } from './utils'

describe('utils', () => {

    describe('detectOperatingSystem', () => {
        it('should return linux 64-bit', () => {
            const config = createChromeFullConfig({
                os: 'linux',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Linux_x64',
                filename: 'linux'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return linux 32-bit', () => {
            const config = createChromeFullConfig({
                os: 'linux',
                arch: 'x86',
            })

            const expectedOSSettings: IOSSettings = {
                url: 'Linux',
                filename: 'linux'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return windows 64-bit', () => {
            const config = createChromeFullConfig({
                os: 'win',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Win_x64',
                filename: 'win'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return windows 32-bit', () => {
            const config = createChromeFullConfig({
                os: 'win',
                arch: 'x86',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Win',
                filename: 'win'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return mac 64-Bit', () => {
            const config = createChromeFullConfig({
                os: 'mac',
                arch: 'x64',
            })
            const expectedOSSettings: IOSSettings = {
                url: 'Mac',
                filename: 'mac'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should return mac ARM', () => {
            const config = createChromeFullConfig({
                os: 'mac',
                arch: 'arm',
            })

            const expectedOSSettings: IOSSettings = {
                url: 'Mac_Arm',
                filename: 'mac'
            }

            const osSettings = detectOperatingSystem(config)

            expect(osSettings).toEqual(expectedOSSettings)
        })

        it('should throw an error on unknown os received', () => {
            const config = createChromeFullConfig({
                os: 'foo' as unknown as OS,
            })
            expect(() => {
                detectOperatingSystem(config)
            }).toThrow(new Error('Unsupported operation system: foo'))
        })
    })

    describe('mapOS', () => {
        //
    })

    describe('waitFor', () => {

        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterAll(() => {
            jest.useRealTimers()
        })

        it('should not complete initially', async () => {
            const spy = jest.fn()
            async function callSpyAfterTime() {
                await waitFor(3000)
                spy()
            }

            callSpyAfterTime()

            expect(spy).toHaveBeenCalledTimes(0)
        })

        it('should complete after the time has passed', async () => {
            const spy = jest.fn()
            async function callSpyAfterTime() {
                await waitFor(3000)
                spy()
            }

            const caller = callSpyAfterTime()
            jest.advanceTimersByTime(3000)
            await caller

            expect(spy).toHaveBeenCalledTimes(1)
        })
    })

    describe('popArray', () => {
        it('should yield the array', () => {

            const gen = popArray([1,2,3,4])

            expect(gen.next()).toEqual({value: 1, done: false})
            expect(gen.next()).toEqual({value: 2, done: false})
            expect(gen.next()).toEqual({value: 3, done: false})
            expect(gen.next()).toEqual({value: 4, done: false})
            expect(gen.next()).toEqual({value: undefined, done: true})
        })
    })
})
