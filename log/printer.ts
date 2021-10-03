/* eslint-disable-next-line import/no-namespace */
import * as chalk from 'chalk'

import type { PrinterWriteStream } from '../interfaces/printer.interfaces'

const silentWriteStream: PrinterWriteStream = {
    clearLine: () => true,
    write: () => true,
    cursorTo: () => true,
    moveCursor: () => true,
}

export abstract class Printer<T extends Printer<T>> {

    protected readonly SUCCESS_FN = (msg: string): string => chalk.green(`✔ ${msg}`)
    protected readonly ERROR_FN = (msg: string): string => chalk.red(`✘ ${msg}`)
    protected readonly WARN_FN = (msg: string): string => chalk.yellow(`! ${msg}`)

    protected constructor(private stdio: PrinterWriteStream) {
    }

    protected abstract self(): T

    protected abstract stop(): T

    /**
     * Writes the given text to stdio. Does nothing, if no text is provided
     * @param text 
     * @returns 
     */
    protected write(text?: string): T {
        if (text) {
            this.stdio.write(text)
        }
        return this.self()
    }

    protected clearLine(): T {
        try {
            this.stdio.clearLine(0)
            this.stdio.cursorTo(0)
        } catch {
            // this might fail when piping stdout to /dev/null. Just ignore it in this case
        }
        return this.self()
    }

    protected newline(): T {
        this.stdio.write('\n')
        return this.self()
    }

    protected deleteLastLine(): T {
        this.stdio.moveCursor(0, -1)
        this.clearLine()
        return this.self()
    }

    public info(text: string): T {
        return this.clearLine()
            .stop()
            .write(text)
            .newline()
    }

    public warn(text: string): T {
        return this.clearLine()
            .stop()
            .write(this.WARN_FN(text))
            .newline()
    }

    /**
     * Suppresses all log output. Can't be undone on a running instance
     */
    public silent(): void {
        this.stdio = silentWriteStream
    }
}
