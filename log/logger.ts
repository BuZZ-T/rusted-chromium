import type { PrinterWriteStream } from '../interfaces/printer.interfaces'
import { Printer } from './printer'

export enum DebugMode {
    NONE,
    DEBUG,
}

/**
 * Just a simple logger which holds no state. Try to prevent this when giving feedback to the user.
 * Rather try to use a stateful logging like Spinner, Progress or Status
 */
export class Logger extends Printer<Logger> {
    public constructor(stdio: PrinterWriteStream) {
        super(stdio)
    }

    private debugMode = DebugMode.NONE
    
    protected self(): Logger {
        return this
    }

    public setDebugMode(mode: DebugMode): Logger {
        this.debugMode = mode
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
            .write(this.infoFn(text))
            .newline()
    }

    public error(text: string): Logger {
        return this.clearLine()
            .write(this.errorFn(text))
            .newline()

    }

    public warn(text: string): Logger {
        return this.clearLine()
            .write(this.warnFn(text))
            .newline()
    }

    public debug(text: string): Logger {
        return this.debugMode !== DebugMode.NONE
            ? this.clearLine()
                .write(this.debugFn(text))
                .newline()
            : this.self()
    }
}

export const logger = new Logger(process.stdout)
