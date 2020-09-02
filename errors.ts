export enum RestError {
    BadRequest = 'BadRequest',
    Unauthorized = 'Unauthorized',
    Forbidden = 'Forbidden',
    NotFound = 'NotFound'
}

export function findAndThrowError(response: Response): never | void {
    [ BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError ].forEach(error => {
        if (error.match(response)) {
            throw new error(response)
        }
    })
}

export class HttpError extends Error {
    public constructor(statusCode: number, status: string, path: string) {
        // super(`${statusCode} ${status}${message ? ': ' + message : ''}`)
        super(`${statusCode} ${status}${path}`)
        this.name = 'Http Error'
    }
}

export class BadRequestError extends HttpError {
    private static STATUS_CODE = 400
    private static STATUS = 'Bad Request'

    private path: string

    public static match(response: Response) {
        return response.status === BadRequestError.STATUS_CODE
    }

    public constructor(response: Response) {
        super(BadRequestError.STATUS_CODE, BadRequestError.STATUS, JSON.stringify(response))
        // this.path = response.url
    }
}

export class UnauthorizedError extends Error {
    private path: string
    
    public static match(response: Response) {
        return response.status === 401
    }

    public constructor(response: Response) {
        super('Unauthorized')
        this.name = RestError.Unauthorized
        this.path = response.url
    }
}

export class ForbiddenError extends Error {
    private path: string
    
    public static match(response: Response) {
        return response.status === 403
    }

    public constructor(response: Response) {
        super('Forbidden')
        this.name = RestError.Forbidden
        this.path = response.url
    }
}

export class NotFoundError extends Error {
    private path: string

    public static match(response: Response) {
        return response.status === 404
    }

    public constructor(response: Response) {
        super('Path not found')
        this.name = RestError.NotFound
        this.path = response.url
    }
}
