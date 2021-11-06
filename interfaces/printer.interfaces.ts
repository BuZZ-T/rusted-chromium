export type PrinterWriteStream = Pick<NodeJS.WriteStream, 'write' | 'clearLine' | 'cursorTo' | 'moveCursor'>
