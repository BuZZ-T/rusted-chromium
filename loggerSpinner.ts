import * as chalk from 'chalk'

import { LoggerConfig, TextFunction } from './interfaces'
import { isTextFunction } from './utils'

export class LoggerSpinner {

    private readonly DEFAULT_ERROR = 'An error occured'
    private readonly SPINNER_STATES = '⠏⠋⠙⠹⠸⠼⠴⠦⠧⠇'
    private readonly SUCCESS_FN = (msg: string) => chalk.green(`✔ ${msg}`)
    private readonly ERROR_FN = (msg: string) => chalk.red(`✘ ${msg}`)
    private readonly WARN_FN = (msg: string) => chalk.yellow(`! ${msg}`)

    private startText: string | undefined
    private successText: string | undefined | TextFunction
    private errorText: string | undefined | TextFunction
    private stdio: NodeJS.WriteStream
    private timer: ReturnType<typeof setTimeout> | null = null

    public constructor(stdio: NodeJS.WriteStream) {
        this.stdio = stdio
    }

    private clearLine(): LoggerSpinner {
        try {
            this.stdio.clearLine(0)
            this.stdio.cursorTo(0)
        } catch(e) {
            // this might fail when piping stdout to /dev/null. Just ignore it in this case
        }
        return this
    }

    private newline(): LoggerSpinner {
        this.stdio.write('\n')
        return this
    }

    private stop(): LoggerSpinner {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        return this
    }

    private write(text: string): LoggerSpinner {
        this.stdio.write(text)
        return this
    }

    public start(loggingConfig: LoggerConfig): LoggerSpinner {
        const { start, success, fail } = loggingConfig
        this.startText = start
        this.successText = isTextFunction(success)
            ? (text: string) => this.SUCCESS_FN(success(text))
            : this.SUCCESS_FN(success)
        this.errorText = isTextFunction(fail)
            ? (text: string) => this.ERROR_FN(fail(text))
            : this.ERROR_FN(fail)

        this.stop()
        let count = 0
        this.timer = setInterval(() => {
            this.clearLine()

            count = (count + 1) % (this.SPINNER_STATES.length - 1)
            this.stdio.write(`${this.SPINNER_STATES[count]} ${this.startText}`)
        }, 100)

        this.stdio.write(`${this.SPINNER_STATES[0]} ${this.startText}`)

        return this
    }

    public info(text: string): LoggerSpinner {
        return this.clearLine()
            .stop()
            .write(text)
            .newline()
    }

    public warn(text: string): LoggerSpinner {
        return this.clearLine()
            .stop()
            .write(this.WARN_FN(text))
            .newline()
    }

    public success(text?: string): LoggerSpinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.successText)
                ? this.successText(text || '')
                : this.successText || '')
            .newline()
    }

    public error(text?: string): LoggerSpinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.errorText)
                ? this.errorText(text || '')
                : this.errorText || '')
            .newline()
    }
}

export const logger = new LoggerSpinner(process.stdout)
