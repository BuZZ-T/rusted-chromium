import type { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'

import { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { Printer } from './printer'

jest.mock('chalk', () => ({
    yellow: (text: string) => `yellow: ${text}`,
}))

class TestPrinter extends Printer<TestPrinter> {
    
    public constructor(stdio: PrinterWriteStream) {
        super(stdio)
    }
    
    protected self(): TestPrinter {
        return this
    }
    protected stop(): TestPrinter {
        return this
    }

    public writeEmpty(): TestPrinter {
        return this.write()
    }

    public write_(text: string): void {
        this.write(text)
    }

    public deleteLastLine_(): void {
        this.deleteLastLine()
    }
}

describe('Printer', () => {

    let stdioMock: MaybeMockedDeep<PrinterWriteStream>
    let testPrinter: TestPrinter

    beforeEach(() => {
        stdioMock = {
            write: jest.fn(),
            clearLine: jest.fn(),
            cursorTo: jest.fn(),
            moveCursor: jest.fn(),
        }

        testPrinter = new TestPrinter(stdioMock)
    })

    it('should log info', () => {
        testPrinter.info('foo')

        expect(stdioMock.write).toBeCalledTimes(2)
        expect(stdioMock.write.mock.calls).toEqual([
            ['foo'],
            ['\n'],
        ])
        expect(stdioMock.clearLine).toBeCalledTimes(1)
        expect(stdioMock.clearLine).toBeCalledWith(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(1)
        expect(stdioMock.cursorTo).toBeCalledWith(0)
    })

    it('should log warn', () => {
        testPrinter.warn('foo')

        expect(stdioMock.write).toBeCalledTimes(2)
        expect(stdioMock.write.mock.calls).toEqual([
            ['yellow: ! foo'],
            ['\n'],
        ])
        expect(stdioMock.clearLine).toBeCalledTimes(1)
        expect(stdioMock.clearLine).toBeCalledWith(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(1)
        expect(stdioMock.cursorTo).toBeCalledWith(0)
    })

    it('shouldn\'t write something on write without text', () => {
        testPrinter.writeEmpty()

        expect(stdioMock.write).toBeCalledTimes(0)
        expect(stdioMock.clearLine).toBeCalledTimes(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(0)
    })

    it('should silent all log output', () => {
        testPrinter.silent()

        testPrinter.write_('some text')
        testPrinter.info('some info')
        testPrinter.warn('some warn')
        testPrinter.deleteLastLine_()

        expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        expect(stdioMock.write).toHaveBeenCalledTimes(0)
        expect(stdioMock.moveCursor).toHaveBeenCalledTimes(0)
    })
})
