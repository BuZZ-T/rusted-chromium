import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { Printer } from './printer'

/**
 * Just a simple logger which holds no state. Try to prevent this when giving feedback to the user.
 * Rather try to use a stateful logging like Spinner, Progress or Status
 */
export class Logger extends Printer<Logger> {
    public constructor(stdio: PrinterWriteStream) {
        super(stdio)
    }

    protected self(): Logger {
        return this
    }

    /**
     * No state, no stop
     */
    public stop(): Logger {
        return this
    }

    public info(text: string): Logger {
        return this.clearLine()
            .write(this.INFO_FN(text))
            .newline()
    }

    public error(text: string): Logger {
        return this.clearLine()
            .write(this.ERROR_FN(text))
            .newline()

    }

    public warn(text: string): Logger {
        return this.clearLine()
            .write(this.WARN_FN(text))
            .newline()

    }
}

export const logger = new Logger(process.stdout)
