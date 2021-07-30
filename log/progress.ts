import * as chalk from 'chalk'

import { Printer } from './printer'
import { ProgressConfig } from '../interfaces';

class ProgressBar extends Printer<ProgressBar> {

    private DEFAULT_CONFIG: Partial<ProgressConfig> = {
        barLength: 100,
        showNumeric: false,
        steps: 50,
    }

    private config: ProgressConfig | undefined

    public constructor(stdio: NodeJS.WriteStream) {
        super(stdio)
    }

    protected stop(): ProgressBar {
        this.config = undefined
        return this
    }

    private calcNumeric(percent: number): string {
        const steps: number = this.config!.steps as number
        const fracture = Math.round(percent * steps).toString().padStart(steps.toString().length, ' ')
        return `(${fracture}/${steps}${this.config?.unit ? (' ' + this.config?.unit) : ''})`
    }

    private setConfig(config: ProgressConfig): ProgressBar {
        this.config = {
            ...this.DEFAULT_CONFIG,
            ...config,
        }
        return this
    }

    private checkForComplete(percent: number): ProgressBar {
        return percent === 1
            ? this.clearLine()
                .write(this.config?.success)
                .stop()
                .newline()
            : this
    }

    protected self(): ProgressBar {
        return this
    }

    public start(config: ProgressConfig): ProgressBar {
        return this.stop()
                .setConfig(config)
                .write(config.start)
                .newline()
                .fraction(0)
    }

    public fraction(fraction: number): ProgressBar {
        if (!this.config) {
            return this
        }
        const barLength: number = this.config!.barLength as number
        const doneAmount = Math.floor(barLength * fraction)
        const restAmount = barLength - doneAmount

        return this.clearLine()
            .write(`[${chalk.bgWhite(' ').repeat(doneAmount)}${chalk.grey('.').repeat(restAmount)}]${this.config?.showNumeric ? this.calcNumeric(fraction) : ''}`)
            .checkForComplete(fraction)
    }
}

export const progress = new ProgressBar(process.stdout)
