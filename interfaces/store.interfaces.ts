import { OS } from './os.interfaces'

export type Arch = keyof LinuxStore | keyof WinStore | keyof MacStore

export type LinuxStore = {
    x64: string[],
    x86: string[],
}

type StoreToSetStore<S> = {
    [P in keyof S]: Set<string>
}

export type LinuxStoreSet = StoreToSetStore<LinuxStore>
export type WinStoreSet = StoreToSetStore<WinStore>
export type MacStoreSet = StoreToSetStore<MacStore>

export type WinStore = {
    x64: string[],
    x86: string[],
}

export type MacStore = {
    x64: string[],
    arm: string[],
}

export interface IListStore {
    linux: LinuxStore
    mac: MacStore
    win: WinStore
}

export interface ISetStore {
    linux: LinuxStoreSet
    mac: MacStoreSet
    win: WinStoreSet
}

export type StoreSize = {
    [p in OS]: number
}
