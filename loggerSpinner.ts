import { LoggingConfig } from './interfaces';
import * as chalk from 'chalk'

export class LoggerSpinner {

    private readonly DEFAULT_ERROR = 'An error occured'
    private readonly SPINNER_STATES = '⠏⠋⠙⠹⠸⠼⠴⠦⠧⠇'
    private readonly SUCCESS_FN = msg => chalk.green(`✔ ${msg}`)
    private readonly ERROR_FN = msg => chalk.red(`✘ ${msg}`)
    private readonly WARN_FN = msg => chalk.yellow(`! ${msg}`)

    private startText: string
    private successText: string
    private errorText: string
    private stdio: any // NodeJS.WriteStream
    private timer: NodeJS.Timeout | null = null

    public constructor() {
        this.stdio = process.stdout
    }

    private clearLine(): LoggerSpinner {
        try {
            this.stdio.clearLine()
            this.stdio.cursorTo(0)
        } catch {
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

    public start(loggingConfig: LoggingConfig): LoggerSpinner {
        const [start, success, error] = loggingConfig
        this.startText = start
        this.successText = this.SUCCESS_FN(success)
        this.errorText = this.ERROR_FN(error || this.DEFAULT_ERROR)

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

    public success(): LoggerSpinner {
        return this.clearLine()
                   .stop()
                   .write(this.successText)
                   .newline()
    }

    public error(): LoggerSpinner {
        return this.clearLine()
                   .stop()
                   .write(this.errorText)
                   .newline()
    }
}

export const logger = new LoggerSpinner()
