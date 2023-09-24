import { exportStore } from 'rusted-chromium'

exportStore({
    color: true,
    debug: false,
    progress: true,
    quiet: false,
}, process.stdout)
