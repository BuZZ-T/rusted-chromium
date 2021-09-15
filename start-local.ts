/*
 * Start script for ts-node. Is not included in the build
 */
import { rusted } from './rusted'

rusted(process.argv, process.platform)
