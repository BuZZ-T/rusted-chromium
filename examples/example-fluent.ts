import { downloadChromium } from 'rusted-chromium'

downloadChromium.with
    .arch('x64')
    .os('linux')
    .interactive()
    .start()
