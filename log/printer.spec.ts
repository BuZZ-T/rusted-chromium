import { Printer } from './printer'
import { PartialStdio } from '../test.utils'
import { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'

jest.mock('chalk', () => ({
    yellow: (text: string) => `yellow: ${text}`,
}))

class TestPrinter extends Printer<TestPrinter> {
    
    public constructor(stdio: NodeJS.WriteStream) {
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
}

describe('Printer', () => {

    let stdioMock: MaybeMockedDeep<PartialStdio>
    let testPrinter: TestPrinter

    beforeEach(() => {
        stdioMock = {
            write: jest.fn(),
            clearLine: jest.fn(),
            cursorTo: jest.fn(),
        }

        testPrinter = new TestPrinter(stdioMock as unknown as NodeJS.WriteStream)
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
})
