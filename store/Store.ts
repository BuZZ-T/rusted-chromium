import { ComparableVersion } from '../commons/ComparableVersion'
import { OS } from '../interfaces/os.interfaces'
import { Arch, IListStore as IListStore, StoreSize, ISetStore } from '../interfaces/store.interfaces'
import { setStoreToListStore, sortStoreEntries } from '../utils'

export class Store {

    private store: ISetStore

    public constructor(store_: IListStore) {
        this.store = {
            linux: {
                x64: new Set(store_.linux.x64),
                x86: new Set(store_.linux.x86),
            },
            win: {
                x64: new Set(store_.win.x64),
                x86: new Set(store_.win.x86),
            },
            mac: {
                x64: new Set(store_.mac.x64),
                arm: new Set(store_.mac.arm),
            },
        }
    }

    private getByOs<T extends keyof IListStore>(os: T): ISetStore[T] {
        return this.store[os]
    }

    private getByOsArch<O extends keyof IListStore, A extends keyof ISetStore[O]>(os: O, arch: A): ISetStore[O][A] {
        return this.getByOs<typeof os>(os)[arch]
    }

    public getBy(os: OS, arch: Arch): Set<string> {
        if (os === 'linux' && arch === 'x86') {
            return this.getByOsArch<'linux', 'x86'>(os, arch)
        }
        if (os === 'linux' && arch === 'x64') {
            return this.getByOsArch<'linux', 'x64'>(os, arch)
        }

        if (os === 'win' && arch === 'x64') {
            return this.getByOsArch<'win', 'x64'>(os, arch)
        }
        if (os === 'win' && arch === 'x86') {
            return this.getByOsArch<'win', 'x86'>(os, arch)
        }

        if (os === 'mac' && arch === 'x64') {
            return this.getByOsArch<'mac', 'x64'>(os, arch)
        }
        if (os === 'mac' && arch === 'arm') {
            return this.getByOsArch<'mac', 'arm'>(os, arch)
        }

        throw new Error(`Unsupported os/arch combination: ${os}/${arch}`)
    }

    /**
     * Returns whether the store contains the given version for the given os/arch combination
     */
    public has(os: OS, arch: Arch, version: ComparableVersion): boolean {
        return this.getBy(os, arch as Arch).has(version.toString())
    }

    /**
    * Merges an already existing localStore with a newStore.
    * Fluently returns itself
    */
    public merge(store: IListStore): Store
    public merge(store: Store): Store
    public merge(store: Store | IListStore): Store {

        const newStore = store instanceof Store
            ? store.store
            : store

        this.store = {
            win: {
                x64: new Set([...this.store.win.x64, ...newStore.win.x64]),
                x86: new Set([...this.store.win.x86, ...newStore.win.x86]),
            },
            linux: {
                x64: new Set([...this.store.linux.x64, ...newStore.linux.x64]),
                x86: new Set([...this.store.linux.x86, ...newStore.linux.x86]),
            },
            mac: {
                x64: new Set([...this.store.mac.x64, ...newStore.mac.x64]),
                arm: new Set([...this.store.mac.arm, ...newStore.mac.arm]),
            },
        }

        return this
    }

    /**
     * Adds a new version for an os and arch.
     * Fluently returns itself
     */
    public add(os: OS, arch: Arch, version: ComparableVersion): Store {
        this.getBy(os, arch).add(version.toString())

        return this
    }

    public toString(): string {
        return JSON.stringify(sortStoreEntries(setStoreToListStore(this.store)))
    }

    public toFormattedString(spaces = 4): string {
        return JSON.stringify(sortStoreEntries(setStoreToListStore(this.store)), null, spaces)
    }

    public size(): StoreSize {
        return {
            linux: this.store.linux.x64.size + this.store.linux.x86.size,
            win: this.store.win.x64.size + this.store.win.x86.size,
            mac: this.store.mac.x64.size + this.store.mac.arm.size,
        }
    }
}
