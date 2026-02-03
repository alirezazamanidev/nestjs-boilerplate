import { HttpStatus, Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export enum Consumes {
    JSON = 'application/json',
    FORM_DATA = 'multipart/form-data',
    URL_ENCODED = 'application/x-www-form-urlencoded',
    TEXT = 'text/plain',
    HTML = 'text/html',
    XML = 'application/xml',
}

export interface ApiSwaggerEndpointOptions {
    summary: string;
    description?: string;
    consumes?: Consumes[];
    auth?: boolean;
    response: {
        status: 200 | 201 | 204;
        data?: Type<any>;
        isArray?: boolean;
        isPaginated?: boolean;
    };

    errorCodes?: Array<
        400 | 401 | 403 | 409 | 404 | 422 | 500 | 503 | 504 | 505
    >;
}

export class HttpResponseDto {
    @ApiProperty({ example: '1234567890' })
    requestId: string;
    @ApiProperty({ example: 200 })
    statusCode: number;
    @ApiProperty({ example: 'OK' })
    name: string;
    @ApiProperty()
    message: string;
    @ApiProperty()
    data: unknown;
}

export class ErrorResponseDevDto {
    @ApiProperty({})
    name: string;
    @ApiProperty({})
    message: string;
    @ApiProperty({})
    stack: string;
    @ApiProperty({})
    cause: string;
}
export class ErrorResponseDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    requestId: string;

    @ApiProperty({})
    statusCode: number;

    @ApiProperty({})
    error: string;

    @ApiProperty({})
    message: string;

    @ApiProperty({
        required: false,
    })
    errors?: Record<string, string[] | Record<string, any>>;

    @ApiProperty({
        required: false,
        type: ErrorResponseDevDto,
    })
    dev?: ErrorResponseDevDto;
}


export class PaginateMetaDto {
    @ApiProperty({ example: 100 })
    totalItems: number;
    @ApiProperty({ example: 10 })
    itemCount: number;
    @ApiProperty({ example: 10 })
    itemsPerPage: number;
    @ApiProperty({ example: 10 })
    totalPages: number;
    @ApiProperty({ example: 1 })
    currentPage: number;
    @ApiProperty({ example: ['title', 'content'], type: [String] })
    fullTextSearchBy: string[];
    @ApiProperty({
        example: [['id', 'DESC']],
    })
    sortBy: string[][];
}

export class PaginateLinksDto {
    @ApiProperty({ example: 'http://localhost:3000/posts?page=2' })
    current: string;
}

export class PaginatedResponseDto<T> {
    @ApiProperty({ type: 'array' })
    data: T[];
    @ApiProperty({ type: PaginateMetaDto })
    meta: PaginateMetaDto;
    @ApiProperty({ type: PaginateLinksDto })
    links: PaginateLinksDto;
}
