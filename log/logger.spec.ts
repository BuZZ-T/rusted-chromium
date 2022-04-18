/**
 * Tests logger file
 * 
 * @group unit/file/loger
 */

import type { MaybeMockedDeep } from 'ts-jest/dist/utils/testing'

import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { createStdioMock } from '../test/test.utils'
import { DebugMode, Logger } from './logger'

jest.mock('chalk', () => ({
    blue: (text: string) => `blue: ${text}`,
    magenta: (text: string) => `magenta: ${text}`,
    red: (text: string) => `red: ${text}`,
    yellow: (text: string) => `yellow: ${text}`,
}))

describe('logger', () => {
    let stdioMock: MaybeMockedDeep<PrinterWriteStream>
    let logger: Logger
    
    beforeEach(() => {
        stdioMock = createStdioMock()
        logger = new Logger(stdioMock)
    })

    it('should log info', () => {
        logger.info('foo')

        expect(stdioMock.write).toBeCalledTimes(2)
        expect(stdioMock.write.mock.calls).toEqual([
            ['blue: ➔ foo'],
            ['\n'],
        ])
        expect(stdioMock.clearLine).toBeCalledTimes(1)
        expect(stdioMock.clearLine).toBeCalledWith(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(1)
        expect(stdioMock.cursorTo).toBeCalledWith(0)
    })

    it('should log warn', () => {
        logger.warn('foo')

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

    it('should log error', () => {
        logger.error('foo')

        expect(stdioMock.write).toBeCalledTimes(2)
        expect(stdioMock.write.mock.calls).toEqual([
            ['red: ✘ foo'],
            ['\n'],
        ])
        expect(stdioMock.clearLine).toBeCalledTimes(1)
        expect(stdioMock.clearLine).toBeCalledWith(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(1)
        expect(stdioMock.cursorTo).toBeCalledWith(0)
    })

    it('should not log debug on DebugMode.NONE', () => {
        logger.debug('foo')

        expect(stdioMock.write).toBeCalledTimes(0)
        expect(stdioMock.clearLine).toBeCalledTimes(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(0)
    })

    it('should log debug on DebugMode.DEBUG', () => {
        logger.setDebugMode(DebugMode.DEBUG)
        logger.debug('foo')

        expect(stdioMock.write).toBeCalledTimes(2)
        expect(stdioMock.write.mock.calls).toEqual([
            ['magenta: ? foo'],
            ['\n'],
        ])
        expect(stdioMock.clearLine).toBeCalledTimes(1)
        expect(stdioMock.clearLine).toBeCalledWith(0)
        expect(stdioMock.cursorTo).toBeCalledTimes(1)
        expect(stdioMock.cursorTo).toBeCalledWith(0)
    })

    it('should silent all log output', () => {
        logger.silent()

        logger.info('some info')
        logger.warn('some warn')
        logger.error('some error')

        expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        expect(stdioMock.write).toHaveBeenCalledTimes(0)
        expect(stdioMock.moveCursor).toHaveBeenCalledTimes(0)
    })

    it('should to nothing on calling stop', () => {
        logger.stop()

        expect(stdioMock.clearLine).toHaveBeenCalledTimes(0)
        expect(stdioMock.cursorTo).toHaveBeenCalledTimes(0)
        expect(stdioMock.write).toHaveBeenCalledTimes(0)
        expect(stdioMock.moveCursor).toHaveBeenCalledTimes(0)
    })
})