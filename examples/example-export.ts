import { exportStore } from 'rusted-chromium'

exportStore({
    quiet: false,
}, process.stdout)
