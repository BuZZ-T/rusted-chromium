import { exportStore } from 'rusted-chromium'

exportStore({
    debug: false,
    quiet: false,
}, process.stdout)
