/* eslint-disable-next-line import/no-namespace */
import * as chalk from 'chalk'

import type { ProgressConfig } from '../interfaces/interfaces'
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

    private calcNumeric(config: ProgressConfig, percent: number): string {
        const steps: number = config.steps as number
        const fracture = Math.round(percent * steps).toString().padStart(steps.toString().length, ' ')
        const numeric = `${fracture}/${steps}${config.unit ? (' ' + config.unit) : ''}`
        return this.showProgress ? `(${numeric})` : numeric
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
                .write(this.successFn(config.success))
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

        const progressBar = this.showProgress ? `[${chalk.bgWhite(' ').repeat(doneAmount)}${chalk.grey('.').repeat(restAmount)}]` : ''

        return this.clearLine()
            .write(`${progressBar}${this.config.showNumeric ? this.calcNumeric(this.config, fraction) : ''}`)
            .checkForComplete(this.config, fraction)
    }
}

export const progress = new ProgressBar(process.stdout)
