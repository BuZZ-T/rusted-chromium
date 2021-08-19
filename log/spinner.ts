import { LoggerConfig, TextFunction } from '../interfaces'
import { isTextFunction } from '../utils'
import { Printer } from './printer'

export class Spinner extends Printer<Spinner> {

    private readonly DEFAULT_ERROR = 'An error occured'
    private readonly SPINNER_STATES = '⠏⠋⠙⠹⠸⠼⠴⠦⠧⠇'

    private startText: string | undefined
    private successText: string | undefined | TextFunction
    private errorText: string | undefined | TextFunction
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

    public start(loggingConfig: LoggerConfig): Spinner {
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
            this.write(`${this.SPINNER_STATES[count]} ${this.startText}`)
        }, 100)

        this.write(`${this.SPINNER_STATES[0]} ${this.startText}`)

        return this
    }

    public success(text?: string): Spinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.successText)
                ? this.successText(text || '')
                : this.successText || '')
            .newline()
    }

    public error(text?: string): Spinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.errorText)
                ? this.errorText(text || '')
                : this.errorText || '')
            .newline()
    }
}

export const logger = new Spinner(process.stdout)
