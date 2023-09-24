/**
 * Tests progress file
 *
 * @group unit/file/progress
 */

import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { createStdioMock } from '../test/test.utils'
import { ProgressBar } from './progress'

jest.mock('chalk', () => ({
    bgWhite: (text: string) => `bgWhite: ${text}`,
    green: (text: string) => `green: ${text}`,
    grey: (text: string) => `grey: ${text}`,
    red: (text: string) => `red: ${text}`,
}))

describe('ProgressBar', () => {

    let stdioMock: jest.MaybeMockedDeep<PrinterWriteStream>
    let progress: ProgressBar

    beforeEach(() => {
        stdioMock = createStdioMock()

        progress = new ProgressBar(stdioMock as unknown as NodeJS.WriteStream)
    })

    it('should init the progress bar without numbers', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: false,
            steps: 4,
            unit: 'unit_text',
        })

        expect(stdioMock.write).toHaveBeenCalledTimes(3)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .]'],
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
        expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
        expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
    })

    it('should init the progress bar with numbers and without unit', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: true,
            steps: 4,
        })

        expect(stdioMock.write).toHaveBeenCalledTimes(3)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .](0/4)'],
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
        expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
        expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
    })

    it('should init the progress bar with numbers and unit', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: true,
            steps: 4,
            unit: 'unit_text',
        })

        expect(stdioMock.write).toHaveBeenCalledTimes(3)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .](0/4 unit_text)'],
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(1)
        expect(stdioMock.clearLine).toHaveBeenCalledWith(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(1)
        expect(stdioMock.cursorTo).toHaveBeenCalledWith(0)
    })

    it('should update the progress bar without numbers', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: false,
            steps: 4,
            unit: 'unit_text',
        })
        progress.fraction(0.1)

        expect(stdioMock.write).toHaveBeenCalledTimes(4)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .]'],
            ['[bgWhite:  bgWhite:  grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .]'],
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(2)
        expect(stdioMock.clearLine.mock.calls).toEqual([
            [0],
            [0],
        ])
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(2)
        expect(stdioMock.cursorTo.mock.calls).toEqual([
            [0],
            [0],
        ])
    })

    it('should update the progress bar with numbers and unit', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: true,
            steps: 4,
            unit: 'unit_text',
        })
        progress.fraction(0.6)

        expect(stdioMock.write).toHaveBeenCalledTimes(4)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .](0/4 unit_text)'],
            ['[bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .](2/4 unit_text)'],
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(2)
        expect(stdioMock.clearLine.mock.calls).toEqual([
            [0],
            [0],
        ])
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(2)
        expect(stdioMock.cursorTo.mock.calls).toEqual([
            [0],
            [0],
        ])
    })

    it('should finish the progress bar', () => {
        progress.start({
            barLength: 20,
            success: 'success_text',
            fail: 'fail_text',
            start: 'start_text',
            showNumeric: false,
            steps: 4,
            unit: 'unit_text',
        })
        progress.fraction(0.1)
        progress.fraction(1)

        expect(stdioMock.write).toHaveBeenCalledTimes(7)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['[grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .]'],
            ['[bgWhite:  bgWhite:  grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .grey: .]'],
            ['[bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  bgWhite:  ]'],
            ['green: ✔ success_text'],
            ['\n']
        ])
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(5)
        expect(stdioMock.clearLine.mock.calls).toEqual([
            [0],
            [0],
            [0],
            [0],
            [0],
        ])
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(5)
        expect(stdioMock.cursorTo.mock.calls).toEqual([
            [0],
            [0],
            [0],
            [0],
            [0],
        ])
    })

    it('should do nothing on calling fraction when no bar is started', () => {
        progress.fraction(0.3)

        expect(stdioMock.write).toHaveBeenCalledTimes(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
    })

    it('should not print the progress bar on noProgress', () => {
        progress
            .noProgress()
            .start({
                barLength: 20,
                success: 'success_text',
                fail: 'fail_text',
                start: 'start_text',
                showNumeric: true,
                steps: 4,
                unit: 'unit_text',
            })
            .fraction(0.3)
            .fraction(1)

        expect(stdioMock.write).toHaveBeenCalledTimes(7)
        expect(stdioMock.write.mock.calls).toEqual([
            ['start_text'],
            ['\n'],
            ['0/4 unit_text'],
            ['1/4 unit_text'],
            ['4/4 unit_text'],
            ['green: ✔ success_text'],
            ['\n']
        ])
    })
})
