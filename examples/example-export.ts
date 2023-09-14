import { exportStore } from 'rusted-chromium'

exportStore({
    color: true,
    debug: false,
    quiet: false,
}, process.stdout)
