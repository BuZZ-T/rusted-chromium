import { importAndMergeLocalstore } from 'rusted-chromium'

importAndMergeLocalstore({
    color: true,
    debug: false,
    progress: true,
    quiet: false,
    url: 'https://rusted.buzz-t.eu/localstore.json'
})
