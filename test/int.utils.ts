import { Response as NodeFetchResponse } from 'node-fetch'
import { PassThrough } from 'stream'
import { mocked } from 'ts-jest/utils'

import { fetchBranchPosition, fetchChromeUrl, fetchChromeZipFile, fetchChromiumTags, fetchLocalStore } from '../api'
import { createStore } from '../test.utils'

export function mockAllFetches(): void {
    mocked(fetchLocalStore).mockResolvedValue(JSON.stringify(createStore()))
    mocked(fetchChromiumTags).mockResolvedValue('<html><body><h3>Tags</h3><span><span>10.0.0.0</span></span></body></html>')
    mocked(fetchBranchPosition).mockResolvedValue('branch-position')
    mocked(fetchChromeUrl).mockResolvedValue('chrome-url')
    mocked(fetchChromeZipFile).mockResolvedValue(new NodeFetchResponse(new PassThrough()))
}
