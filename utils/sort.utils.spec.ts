/**
 * Tests download file
 *
 * @group unit/utils/sort
 */

import { ComparableVersion } from '../commons/ComparableVersion'
import { sortAscendingComparableVersions, sortDescendingComparableVersions } from './sort.utils'

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
})
