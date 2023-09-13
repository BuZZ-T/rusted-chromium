import type { AnyLoggerConfig, TextFunction } from '../interfaces/interfaces'
import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { isTextFunction } from '../utils/typeguards'
import { Printer } from './printer'

export class Spinner extends Printer<Spinner> {

    private readonly SPINNER_STATES = '⠏⠋⠙⠹⠸⠼⠴⠦⠧⠇'

    private runningText: string | undefined
    private successText: string | undefined | TextFunction
    private errorText: string | undefined | TextFunction
    private timer: ReturnType<typeof setTimeout> | null = null
    private count = 0

    public constructor(stdio: PrinterWriteStream) {
        super(stdio)
    }

    private increaseCount(): void {
        this.count = (this.count + 1) % (this.SPINNER_STATES.length - 1)
    }

    private writeLine(): Spinner {
        return this.clearLine()
            .write(`${this.SPINNER_STATES[this.count]} ${this.runningText}`)
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

    public start(loggingConfig: AnyLoggerConfig): Spinner {
        const { start, success, fail } = loggingConfig
        this.runningText = start
        this.successText = isTextFunction(success)
            ? (text: string) => this.successFn(success(text))
            : this.successFn(success)
        this.errorText = isTextFunction(fail)
            ? (text: string) => this.errorFn(fail(text))
            : this.errorFn(fail)

        this.stop()
        this.count = 0
        this.timer = setInterval(() => {
            this.increaseCount()
            
            this.writeLine()
        }, 100)

        this.write(`${this.SPINNER_STATES[0]} ${this.runningText}`)

        return this
    }

    public success(text?: string): Spinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.successText)
                ? this.successText(text || '')
                : this.successText)
            .newline()
    }

    public error(text?: string): Spinner {
        return this.clearLine()
            .stop()
            .write(isTextFunction(this.errorText)
                ? this.errorText(text || '')
                : this.errorText)
            .newline()
    }
    
    public update(text: string): Spinner {
        if (this.timer) {
            // only update with running spinner
            this.runningText = text
            return this.writeLine()
        }
        
        return this
    }
}

export const spinner = new Spinner(process.stdout)
