interface ErrorStatus {
    status: string
    statusCode: number
}

export const errors = {
    BadRequest: {
        status: 'BadRequest',
        statusCode: 400,
    },
    Unauthorized: {
        status: 'Unauthorized',
        statusCode: 401,
    },
    Forbidden: {
        status: 'Forbidden',
        statusCode: 403,
    },
    NotFound: {
        status: 'NotFound',
        statusCode: 404,
    },
}

export function findAndThrowError(response: Response): never | void {
    [ BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError ].forEach(error => {
        if (error.match(response)) {
            throw new error(response)
        }
    })
}

export class HttpError extends Error {

    protected static statusCode: number

    public constructor(errorStatus: ErrorStatus) {
        super(`${errorStatus.statusCode} ${errorStatus.status}`)
        this.name = 'Http Error'
    }
}

export class BadRequestError extends HttpError {

    private path: string

    public constructor(response: Response) {
        super(errors.BadRequest)
        this.path = response.url
    }

    public static match(response: Response): boolean {
        return response.status === errors.BadRequest.statusCode
    }
}

export class UnauthorizedError extends HttpError {
    private path: string

    public constructor(response: Response) {
        super(errors.Unauthorized)
        this.name = errors.Unauthorized.status
        this.path = response.url
    }

    public static match(response: Response): boolean {
        return response.status === errors.Unauthorized.statusCode
    }
}

export class ForbiddenError extends HttpError {
    private path: string

    public constructor(response: Response) {
        super(errors.Forbidden)
        this.name = errors.Forbidden.status
        this.path = response.url
    }

    public static match(response: Response): boolean {
        return response.status === errors.Forbidden.statusCode
    }
}

export class NotFoundError extends HttpError {
    private path: string

    public constructor(response: Response) {
        super(errors.NotFound)
        this.name = errors.NotFound.status
        this.path = response.url
    }

    public static match(response: Response): boolean {
        return response.status === errors.NotFound.statusCode
    }
}

/**
 * Is thrown if --single is specified, but no binary was found
 */
export class NoChromiumDownloadError extends Error {
    public constructor() {
        super('Single version is specified, but no binary is found')
    }
}

export class NoLocalstoreError extends Error {
    public constructor(path?: string) {
        super(`No "localstore.json" file found${path != null ? ' under the given path: ' + path : ''}`)
    }
}
