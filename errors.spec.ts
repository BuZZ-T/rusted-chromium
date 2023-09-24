/**
 * Tests errors file
 *
 * @group unit/file/errors
 */

import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError, findAndThrowError, NoChromiumDownloadError, NoLocalstoreError } from './errors'

describe('errors', () => {
    describe('findAndThrowError', () => {
        it('should match BadRequestError', () => {
            const pResponse: Partial<Response> = {
                status: 400,
            }

            expect(() => findAndThrowError(pResponse as Response)).toThrow(new Error('400 BadRequest'))
        })

        it('should match UnauthorizedError', () => {
            const pResponse: Partial<Response> = {
                status: 401,
            }

            expect(() => findAndThrowError(pResponse as Response)).toThrow(new Error('401 Unauthorized'))
        })

        it('should match ForbiddenError', () => {
            const pResponse: Partial<Response> = {
                status: 403,
            }

            expect(() => findAndThrowError(pResponse as Response)).toThrow(new Error('403 Forbidden'))
        })

        it('should match NotFoundError', () => {
            const pResponse: Partial<Response> = {
                status: 404,
            }

            expect(() => findAndThrowError(pResponse as Response)).toThrow(new Error('404 NotFound'))
        })
    })

    describe('BadRequestError', () => {
        it('should match', () => {
            const pResponse: Partial<Response> = {
                status: 400,
            }

            expect(BadRequestError.match(pResponse as Response)).toBe(true)
        })

        it('should not match', () => {
            const pResponse: Partial<Response> = {
                status: 401,
            }

            expect(BadRequestError.match(pResponse as Response)).toBe(false)
        })
    })

    describe('Unauthorized', () => {
        it('should match', () => {
            const pResponse: Partial<Response> = {
                status: 401,
            }

            expect(UnauthorizedError.match(pResponse as Response)).toBe(true)
        })

        it('should not match', () => {
            const pResponse: Partial<Response> = {
                status: 402,
            }

            expect(UnauthorizedError.match(pResponse as Response)).toBe(false)
        })
    })

    describe('ForbiddenError', () => {
        it('should match', () => {
            const pResponse: Partial<Response> = {
                status: 403,
            }

            expect(ForbiddenError.match(pResponse as Response)).toBe(true)
        })

        it('should not match', () => {
            const pResponse: Partial<Response> = {
                status: 401,
            }

            expect(ForbiddenError.match(pResponse as Response)).toBe(false)
        })
    })

    describe('NotFoundError', () => {
        it('should match', () => {
            const pResponse: Partial<Response> = {
                status: 404,
            }

            expect(NotFoundError.match(pResponse as Response)).toBe(true)
        })

        it('should not match', () => {
            const pResponse: Partial<Response> = {
                status: 403,
            }

            expect(NotFoundError.match(pResponse as Response)).toBe(false)
        })
    })

    describe('NoChromiumDownloadError', () => {
        it('should set the error message', () => {
            const error = new NoChromiumDownloadError()

            expect(() => {
                throw error
            }).toThrow('Single version is specified, but no binary is found')
        })
    })

    describe('NoLocalstoreError', () => {
        it('should set the error message without path given', () => {
            const error = new NoLocalstoreError()

            expect(() => {
                throw error
            }).toThrow('No "localstore.json" file found')
        })

        it('should set the error message with path given', () => {
            const error = new NoLocalstoreError('some_path')

            expect(() => {
                throw error
            }).toThrow('No "localstore.json" file found under the given path: some_path')
        })
    })
})
