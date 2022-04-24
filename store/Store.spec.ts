/**
 * Tests rusted file
 * 
 * @group unit/class/Store
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import type { Arch } from '../interfaces/store.interfaces'
import { createStore } from '../test/test.utils'
import { Store } from './Store'

describe('Store', () => {

    describe('getBy', () => {
        it('should extract the store', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: ['11.0.0.0'],
                },
                mac: {
                    arm: ['12.0.0.0'],
                    x64: ['13.0.0.0'],
                },
                win: {
                    x64: ['14.0.0.0'],
                    x86: ['15.0.0.0'],
                },
            }))

            const linux64 = store.getBy('linux', 'x64')
            const linux32 = store.getBy('linux', 'x86')
            const win64 = store.getBy('win', 'x64')
            const win32 = store.getBy('win', 'x86')
            const mac64 = store.getBy('mac', 'x64')
            const macArm = store.getBy('mac', 'arm')

            expect(linux64).toEqual(new Set(['10.0.0.0']))
            expect(linux32).toEqual(new Set(['11.0.0.0']))
            expect(macArm).toEqual(new Set(['12.0.0.0']))
            expect(mac64).toEqual(new Set(['13.0.0.0']))
            expect(win64).toEqual(new Set(['14.0.0.0']))
            expect(win32).toEqual(new Set(['15.0.0.0']))
        })

        it('should throw on unknown arch', () => {
            expect(() => new Store(createStore()).getBy('linux', 'foo' as unknown as Arch)).toThrow('Unsupported os/arch combination: linux/foo')
        })

        it('should throw on unsupported os/arch combination for linux', () => {
            expect(() => new Store(createStore()).getBy('linux', 'arm')).toThrow('Unsupported os/arch combination: linux/arm')
        })

        it('should throw on unsupported os/arch combination for mac', () => {
            expect(() => new Store(createStore()).getBy('mac', 'x86')).toThrow('Unsupported os/arch combination: mac/x86')
        })

        it('should throw on unsupported os/arch combination for win', () => {
            expect(() => new Store(createStore()).getBy('win', 'arm')).toThrow('Unsupported os/arch combination: win/arm')
        })
    })

    describe('has', () => {
        it('should have', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            const comparableVersion = new ComparableVersion(10, 0, 0, 0)

            expect(store.has('linux', 'x64', comparableVersion)).toBe(true)
            expect(store.has('linux', 'x86', comparableVersion)).toBe(false)

            expect(store.has('win', 'x64', comparableVersion)).toBe(false)
            expect(store.has('win', 'x86', comparableVersion)).toBe(false)

            expect(store.has('mac', 'x64', comparableVersion)).toBe(false)
            expect(store.has('mac', 'x64', comparableVersion)).toBe(false)

            expect(store.has('linux', 'x64', new ComparableVersion(11, 0, 0, 0))).toBe(false)
        })
    })

    describe('merge', () => {
        it('should merge with a Store', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            const mergeStore = new Store(createStore({
                win: {
                    x64: ['10.0.0.0'],
                    x86: ['11.0.0.0'],
                },
                linux: {
                    x64: ['12.0.0.0'],
                    x86: ['15.0.0.0']
                }
            }))

            expect(store.merge(mergeStore)).toEqual(new Store(createStore({
                win: {
                    x64: ['10.0.0.0'],
                    x86: ['11.0.0.0'],
                },
                linux: {
                    x64: ['10.0.0.0', '12.0.0.0'],
                    x86: ['15.0.0.0']
                }
            })))
        })

        it('should merge with an IStore', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            const mergeStore = createStore({
                win: {
                    x64: ['10.0.0.0'],
                    x86: ['11.0.0.0'],
                },
                linux: {
                    x64: ['12.0.0.0'],
                    x86: ['15.0.0.0']
                }
            })

            expect(store.merge(mergeStore)).toEqual(new Store(createStore({
                win: {
                    x64: ['10.0.0.0'],
                    x86: ['11.0.0.0'],
                },
                linux: {
                    x64: ['10.0.0.0', '12.0.0.0'],
                    x86: ['15.0.0.0']
                }
            })))
        })

        it('should not list already existing versions twice', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            const mergeStore = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.merge(mergeStore)).toEqual(new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            })))
        })
    })

    describe('add', () => {
        it('should add a version of the same os/arch', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.add('linux', 'x64', new ComparableVersion(11, 0, 0, 0))).toEqual(new Store(createStore({
                linux: {
                    x64: ['10.0.0.0', '11.0.0.0'],
                    x86: []
                }
            })))
        })

        it('should add the same version to a different os/arch', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.add('win', 'x64', new ComparableVersion(10, 0, 0, 0))).toEqual(new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                },
                win: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            })))
        })

        it('should not add a already added version', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.add('linux', 'x64', new ComparableVersion(10, 0, 0, 0))).toEqual(new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            })))
        })
    })

    describe('toString', () => {
        it('should format the store', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.toString()).toEqual('{"win":{"x64":[],"x86":[]},"linux":{"x64":["10.0.0.0"],"x86":[]},"mac":{"x64":[],"arm":[]}}')
        })

        it('should format the store with indention', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0'],
                    x86: []
                }
            }))

            expect(store.toFormattedString()).toEqual(`{
    "win": {
        "x64": [],
        "x86": []
    },
    "linux": {
        "x64": [
            "10.0.0.0"
        ],
        "x86": []
    },
    "mac": {
        "x64": [],
        "arm": []
    }
}`)
        })

        it('should format the store with indentation without indenting the arrays', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0', '20.0.0.0', '30.0.0.0'],
                    x86: ['10.0.0.0']
                }
            }))

            expect(store.toMinimalFormattedString()).toEqual(`{
    "win": {
        "x64": [],
        "x86": []
    },
    "linux": {
        "x64": ["10.0.0.0","20.0.0.0","30.0.0.0"],
        "x86": ["10.0.0.0"]
    },
    "mac": {
        "x64": [],
        "arm": []
    }
}`)
        })

        it('should create a parsable string using toString', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0', '20.0.0.0', '30.0.0.0'],
                    x86: ['10.0.0.0']
                }
            }))

            const parsedStore = JSON.parse(store.toString())

            expect(new Store(parsedStore)).toEqual(store)
        })

        it('should create a parsable string using toFormattedString', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0', '20.0.0.0', '30.0.0.0'],
                    x86: ['10.0.0.0']
                }
            }))

            const parsedStore = JSON.parse(store.toFormattedString())

            expect(new Store(parsedStore)).toEqual(store)
        })

        it('should create a parsable string using toMinimalFormattedString', () => {
            const store = new Store(createStore({
                linux: {
                    x64: ['10.0.0.0', '20.0.0.0', '30.0.0.0'],
                    x86: ['10.0.0.0']
                }
            }))

            const parsedStore = JSON.parse(store.toMinimalFormattedString())

            expect(new Store(parsedStore)).toEqual(store)
        })

    })
})
