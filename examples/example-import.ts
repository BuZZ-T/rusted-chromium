import { importAndMergeLocalstore } from 'rusted-chromium'

importAndMergeLocalstore({
    debug: false,
    quiet: false,
    url: 'https://rusted.buzz-t.eu/localstore.json'
})
