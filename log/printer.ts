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
    protected successFn(msg: string): string {
        return this.showColors
            ? chalk.green(`✔ ${msg}`)
            : `✔ ${msg}`
    }

    protected errorFn(msg: string): string {
        return this.showColors
            ? chalk.red(`✘ ${msg}`)
            : `✘ ${msg}`
    }

    protected warnFn(msg: string): string {
        return this.showColors
            ? chalk.yellow(`! ${msg}`)
            : `! ${msg}`
    }

    protected infoFn(msg: string): string {
        return this.showColors
            ? chalk.blue(`➔ ${msg}`)
            : `➔ ${msg}`
    }

    protected debugFn(msg: string): string {
        return this.showColors
            ? chalk.magenta(`? ${msg}`)
            : `? ${msg}`
    }

    private showColors = true

    protected showProgress = true

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
        // stdio.moveCursor might not be available in some environments
        if (typeof this.stdio.moveCursor === 'function') {
            this.stdio.moveCursor(0, -1)
        }
        this.clearLine()
        return this.self()
    }

    /**
     * Suppresses all log output. Can't be undone on a running instance
     */
    public silent(): T {
        this.stdio = silentWriteStream

        return this.self()
    }

    /**
     * Suppresses all colors on logging output. Can't be undone on a running instance
     */
    public noColor(): T {
        this.showColors = false

        return this.self()
    }

    /**
     * Suppresses all output of progress bars. Can't be undone on a running instance
     */
    public noProgress(): T {
        this.showProgress = false

        return this.self()
    }
}
