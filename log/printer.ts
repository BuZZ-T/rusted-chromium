import * as chalk from 'chalk';
export abstract class Printer<T extends Printer<T>> {

    protected readonly SUCCESS_FN = (msg: string) => chalk.green(`✔ ${msg}`)
    protected readonly ERROR_FN = (msg: string) => chalk.red(`✘ ${msg}`)
    protected readonly WARN_FN = (msg: string) => chalk.yellow(`! ${msg}`)

    protected constructor(private stdio: NodeJS.WriteStream) {
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
}
