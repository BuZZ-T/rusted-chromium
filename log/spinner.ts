import { LoggerConfig } from '../interfaces'
import { Printer } from './printer'

export class Spinner extends Printer<Spinner> {

    private readonly DEFAULT_ERROR = 'An error occured'
    private readonly SPINNER_STATES = '⠏⠋⠙⠹⠸⠼⠴⠦⠧⠇'


    private startText: string | undefined
    private successText: string | undefined
    private errorText: string | undefined
    private timer: ReturnType<typeof setTimeout> | null = null

    public constructor(stdio: NodeJS.WriteStream) {
        super(stdio)
    }

    protected self(): Spinner {
        return this
    }

    protected stop(): Spinner {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        return this
    }

    public start(loggerConfig: LoggerConfig): Spinner {
        const { start, success, fail } = loggerConfig
        this.startText = start
        this.successText = this.SUCCESS_FN(success)
        this.errorText = this.ERROR_FN(fail || this.DEFAULT_ERROR)

        this.stop()
        let count = 0
        this.timer = setInterval(() => {
            this.clearLine()

            count = (count + 1) % (this.SPINNER_STATES.length - 1)
            this.write(`${this.SPINNER_STATES[count]} ${this.startText}`)
        }, 100)

        this.write(`${this.SPINNER_STATES[0]} ${this.startText}`)

        return this
    }

    public success(): Spinner {
        return this.clearLine()
            .stop()
            .write(this.successText || '')
            .newline()
    }

    public error(text?: string): Spinner {
        return this.clearLine()
            .stop()
            .write(text ? this.ERROR_FN(text) : this.errorText || '')
            .newline()
    }
}

export const logger = new Spinner(process.stdout)
