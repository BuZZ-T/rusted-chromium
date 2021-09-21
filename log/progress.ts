import * as chalk from 'chalk'

import { ProgressConfig } from '../interfaces'
import { Printer } from './printer'

export class ProgressBar extends Printer<ProgressBar> {

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

    private static calcNumeric(config: ProgressConfig, percent: number): string {
        const steps: number = config.steps as number
        const fracture = Math.round(percent * steps).toString().padStart(steps.toString().length, ' ')
        return `(${fracture}/${steps}${config.unit ? (' ' + config.unit) : ''})`
    }

    private setConfig(config: ProgressConfig): ProgressBar {
        this.config = {
            ...this.DEFAULT_CONFIG,
            ...config,
        }
        return this
    }

    private checkForComplete(config: ProgressConfig, percent: number): ProgressBar {
        return percent === 1
            ? this.clearLine()
                .deleteLastLine()
                .write(this.SUCCESS_FN(config.success))
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
        const barLength: number = this.config.barLength as number
        const doneAmount = Math.floor(barLength * fraction)
        const restAmount = barLength - doneAmount

        return this.clearLine()
            .write(`[${chalk.bgWhite(' ').repeat(doneAmount)}${chalk.grey('.').repeat(restAmount)}]${this.config.showNumeric ? ProgressBar.calcNumeric(this.config, fraction) : ''}`)
            .checkForComplete(this.config, fraction)
    }
}

export const progress = new ProgressBar(process.stdout)
