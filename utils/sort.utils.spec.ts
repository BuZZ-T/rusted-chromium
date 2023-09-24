/**
 * Tests download file
 *
 * @group unit/utils/sort
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { MappedVersion } from '../commons/MappedVersion'
import { createStore } from '../test/test.utils'
import { sortDescendingMappedVersions, sortAscendingMappedVersions, sortStoreEntries, sortAscendingComparableVersions, sortDescendingComparableVersions } from './sort.utils'

describe('sort utils', () => {

    describe('sortAscendingComparableVersions', () => {
        let versionMajor1: ComparableVersion
        let versionMajor2: ComparableVersion
        let versionMinor: ComparableVersion
        let versionBranch: ComparableVersion
        let versionPatch: ComparableVersion
        let versionInfinity: ComparableVersion

        beforeEach(() => {
            versionMajor1 = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            })
            versionMajor2 = new ComparableVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
            })
            versionMinor = new ComparableVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
            })
            versionBranch = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
            })
            versionPatch = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
            })
            versionInfinity = new ComparableVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
            })
        })

        it('should sort the ComparableVersion arrays accordingly reverse', () => {
            expect([versionMajor1, versionMajor2].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionMajor2])
            expect([versionMajor2, versionMajor1].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionMajor2])

            expect([versionMajor1, versionMajor1].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionMinor])
            expect([versionMajor1, versionBranch].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionBranch])
            expect([versionMajor1, versionPatch].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionPatch])
            expect([versionMajor1, versionInfinity].sort(sortAscendingComparableVersions)).toEqual([versionMajor1, versionInfinity])
        })
    })

    describe('sortDescendingComparableVersions', () => {
        let versionMajor1: ComparableVersion
        let versionMajor2: ComparableVersion
        let versionMinor: ComparableVersion
        let versionBranch: ComparableVersion
        let versionPatch: ComparableVersion
        let versionInfinity: ComparableVersion

        beforeEach(() => {
            versionMajor1 = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
            })
            versionMajor2 = new ComparableVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
            })
            versionMinor = new ComparableVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
            })
            versionBranch = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
            })
            versionPatch = new ComparableVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
            })
            versionInfinity = new ComparableVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
            })
        })

        it('should sort the MappedVersion arrays accordingly', () => {
            expect([versionMajor1, versionMajor2].sort(sortDescendingComparableVersions)).toEqual([versionMajor2, versionMajor1])
            expect([versionMajor2, versionMajor1].sort(sortDescendingComparableVersions)).toEqual([versionMajor2, versionMajor1])

            expect([versionMajor1, versionMajor1].sort(sortDescendingComparableVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortDescendingComparableVersions)).toEqual([versionMinor, versionMajor1])
            expect([versionMajor1, versionBranch].sort(sortDescendingComparableVersions)).toEqual([versionBranch, versionMajor1])
            expect([versionMajor1, versionPatch].sort(sortDescendingComparableVersions)).toEqual([versionPatch, versionMajor1])
            expect([versionMajor1, versionInfinity].sort(sortDescendingComparableVersions)).toEqual([versionInfinity, versionMajor1])
        })
    })

    describe('sortAscendingMappedVersions', () => {
        let versionMajor1: MappedVersion
        let versionMajor2: MappedVersion
        let versionMinor: MappedVersion
        let versionBranch: MappedVersion
        let versionPatch: MappedVersion
        let versionInfinity: MappedVersion

        beforeEach(() => {
            versionMajor1 = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMajor2 = new MappedVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMinor = new MappedVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionBranch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
                disabled: false
            })
            versionPatch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
                disabled: false
            })
            versionInfinity = new MappedVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
        })

        it('should sort the MappedVersion arrays accordingly reverse', () => {
            expect([versionMajor1, versionMajor2].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor2])
            expect([versionMajor2, versionMajor1].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor2])

            expect([versionMajor1, versionMajor1].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionMinor])
            expect([versionMajor1, versionBranch].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionBranch])
            expect([versionMajor1, versionPatch].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionPatch])
            expect([versionMajor1, versionInfinity].sort(sortAscendingMappedVersions)).toEqual([versionMajor1, versionInfinity])
        })
    })

    describe('sortDescendingMappedVersions', () => {

        let versionMajor1: MappedVersion
        let versionMajor2: MappedVersion
        let versionMinor: MappedVersion
        let versionBranch: MappedVersion
        let versionPatch: MappedVersion
        let versionInfinity: MappedVersion

        beforeEach(() => {
            versionMajor1 = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMajor2 = new MappedVersion({
                major: 20,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionMinor = new MappedVersion({
                major: 10,
                minor: 1,
                branch: 0,
                patch: 0,
                disabled: false
            })
            versionBranch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 1,
                patch: 0,
                disabled: false
            })
            versionPatch = new MappedVersion({
                major: 10,
                minor: 0,
                branch: 0,
                patch: 1,
                disabled: false
            })
            versionInfinity = new MappedVersion({
                major: Infinity,
                minor: 0,
                branch: 0,
                patch: 0,
                disabled: false
            })
        })

        it('should sort the MappedVersion arrays accordingly', () => {
            expect([versionMajor1, versionMajor2].sort(sortDescendingMappedVersions)).toEqual([versionMajor2, versionMajor1])
            expect([versionMajor2, versionMajor1].sort(sortDescendingMappedVersions)).toEqual([versionMajor2, versionMajor1])

            expect([versionMajor1, versionMajor1].sort(sortDescendingMappedVersions)).toEqual([versionMajor1, versionMajor1])

            expect([versionMajor1, versionMinor].sort(sortDescendingMappedVersions)).toEqual([versionMinor, versionMajor1])
            expect([versionMajor1, versionBranch].sort(sortDescendingMappedVersions)).toEqual([versionBranch, versionMajor1])
            expect([versionMajor1, versionPatch].sort(sortDescendingMappedVersions)).toEqual([versionPatch, versionMajor1])
            expect([versionMajor1, versionInfinity].sort(sortDescendingMappedVersions)).toEqual([versionInfinity, versionMajor1])
        })
    })

    describe('sortStoreEntries', () => {
        it('should sort the store entries', () => {
            const unsortedWin = createStore({
                win: {
                    x64: ['10.0.0.0', '9.0.0.0'],
                    x86: ['10.0.0.1', '10.0.0.0']
                }
            })

            const sortedWin = createStore({
                win: {
                    x64: ['9.0.0.0', '10.0.0.0'],
                    x86: ['10.0.0.0', '10.0.0.1']
                }
            })
            expect(sortStoreEntries(unsortedWin)).toEqual(sortedWin)
        })

        it('should sort all os', () => {
            const unsortedAll = createStore({
                win: {
                    x64: ['10.0.0.0', '9.0.0.0'],
                    x86: ['10.0.0.1', '10.0.0.0']
                },
                linux: {
                    x64: ['100.0.0.0', '90.0.0.0'],
                    x86: ['50.0.0.1', '60.0.0.0']
                },
                mac: {
                    x64: ['10.11.0.0', '10.0.0.0'],
                    arm: ['10.0.0.1', '10.0.0.0']
                },
            })
            const sortedAll = createStore({
                win: {
                    x64: ['9.0.0.0', '10.0.0.0'],
                    x86: ['10.0.0.0', '10.0.0.1']
                },
                linux: {
                    x64: ['90.0.0.0', '100.0.0.0'],
                    x86: ['50.0.0.1', '60.0.0.0']
                },
                mac: {
                    x64: ['10.0.0.0', '10.11.0.0'],
                    arm: ['10.0.0.0', '10.0.0.1']
                },
            })

            expect(sortStoreEntries(unsortedAll)).toEqual(sortedAll)
        })
    })
})
