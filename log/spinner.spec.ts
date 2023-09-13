/**
 * Tests spinner file
 * 
 * @group unit/file/spinner
 */

/* eslint-disable-next-line import/no-namespace */
import * as chalk from 'chalk'

import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { createStdioMock } from '../test/test.utils'
import { Spinner } from './spinner'

jest.mock('chalk', () => ({
    green: (text: string) => `green: ${text}`,
    red: (text: string) => `red: ${text}`,
}))

describe('loggerSpinner', () => {

    let spinner: Spinner
    let stdioMock: jest.MaybeMockedDeep<PrinterWriteStream>

    beforeEach(() => {
        stdioMock = createStdioMock()

        spinner = new Spinner(stdioMock)
    })

    beforeEach(() => {
        jest.useFakeTimers()

        jest.mocked(chalk)

        stdioMock.write.mockReset()
        stdioMock.clearLine.mockReset()
        stdioMock.cursorTo.mockReset()
    })

    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
    })

    describe('start', () => {
        it('should write the initial spinner including text', () => {
            expect(stdioMock.write).toHaveBeenCalledTimes(0)

            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)
            expect(stdioMock.write).toHaveBeenCalledWith('⠏ start_text')
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        })

        it('should write the spinner after one tick', () => {
            expect(stdioMock.write).toHaveBeenCalledTimes(0)

            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            jest.advanceTimersByTime(100)

            expect(stdioMock.write).toHaveBeenCalledTimes(2)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['⠋ start_text'],
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should surpress if clearLine throws an error', () => {
            stdioMock.clearLine.mockImplementation(() => {
                throw new Error()
            })

            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            jest.advanceTimersByTime(100)

            expect(stdioMock.write).toHaveBeenCalledTimes(2)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['⠋ start_text'],
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        })

        it('should surpress if cursorTo throws an error', () => {
            stdioMock.cursorTo.mockImplementation(() => {
                throw new Error()
            })

            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            jest.advanceTimersByTime(100)

            expect(stdioMock.write).toHaveBeenCalledTimes(2)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['⠋ start_text'],
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
        })
    })

    describe('success', () => {
        it('should write the success text', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.success()

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['green: ✔ success_text'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should write the success text with dynamic text', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: text => `success_text (${text})`,
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.success('foo')

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['green: ✔ success_text (foo)'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should ignore the dynamic text on no TextFunction passed', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.success('foo')

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['green: ✔ success_text'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should print the success text without dynamic text', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: text => `success_text (${text})`,
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.success()

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['green: ✔ success_text ()'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should print the success text without color', () => {
            spinner.noColor()
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: text => `success_text (${text})`,
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.success()

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['✔ success_text ()'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })
    })

    describe('error', () => {
        it('should write the fail text', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.error()

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['red: ✘ fail_text'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should write the fail text with dynamic text', () => {
            spinner.start({
                start: 'start_text',
                fail: text => `fail_text (${text})`,
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.error('foo')

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['red: ✘ fail_text (foo)'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should ignore the dynamic text on no TextFunction passed', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.error('foo')

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['red: ✘ fail_text'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should print the fail text without dynamic text', () => {
            spinner.start({
                start: 'start_text',
                fail: text => `fail_text (${text})`,
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.error()

            expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['red: ✘ fail_text ()'],
                ['\n']
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })
    })

    describe('update', () => {
        it('should do nothing on not running spinner', () => {
            spinner.update('update-text')

            expect(stdioMock.write).toHaveBeenCalledTimes(0)
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        })

        it('should update the text on running spinner', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            expect(stdioMock.write).toHaveBeenCalledTimes(1)

            spinner.update('update-text')

            expect(stdioMock.write).toHaveBeenCalledTimes(2)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['⠏ update-text'],
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })

        it('should update the text on running spinner again', () => {
            spinner.start({
                start: 'start_text',
                fail: 'fail_text',
                success: 'success_text',
            })

            spinner.update('update-text')
            spinner.update('update-text2')

            // expect(stdioMock.write).toHaveBeenCalledTimes(3)
            expect(stdioMock.write.mock.calls).toEqual([
                ['⠏ start_text'],
                ['⠏ update-text'],
                ['⠏ update-text2'],
            ])
            expect(stdioMock.clearLine).toHaveBeenCalledTimes(2)
            expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
            expect(stdioMock.cursorTo).toHaveBeenCalledTimes(2)
            expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
        })
    })
})
