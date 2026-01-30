export  class HttpResponse {
    constructor(
        public readonly requestId: string = '',
        public readonly statusCode: number,
        public readonly name: string,
        public message: string = '',
        public readonly data: unknown = {},
    ) {}
}

export class OkResponse extends HttpResponse {
    constructor(
        public readonly requestId: string = '',
        data?: unknown,
        message: string = 'همه چیز عالی پیش رفت.',
    ) {
        super(requestId, 200, 'OK', message, data);
    }
    static from(response: HttpResponse): OkResponse {
        return new OkResponse(
            response.requestId,
            response.data,
            response.message,
        );
    }
}

export class CreatedResponse extends HttpResponse {
    constructor(
        requestId: string = '',
        data?: unknown,
        message: string = 'با موفقیت ایجاد شد.',
    ) {
        super(requestId, 201, 'Created', message, data);
    }
}

export class NoContentResponse extends HttpResponse {
    constructor(requestId: string = '') {
        super(requestId, 204, 'No Content', '', {});
    }
}

type ResponseClassConstructor = new (
    requestId?: string,
    data?: unknown,
) => HttpResponse;

export const responseClassMap: Record<number, ResponseClassConstructor> = {
    200: OkResponse,
    201: CreatedResponse,
    204: NoContentResponse,
};
