import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiExtraModels,
    getSchemaPath,
    ApiConsumes,
    ApiBearerAuth,
    ApiHeader,
    ApiQuery,
} from '@nestjs/swagger';
import {
    HttpResponseDto,
    PaginateMetaDto,
    PaginateLinksDto,
    ApiSwaggerEndpointOptions,
    Consumes,
    ErrorResponseDto,
    PaginatedResponseDto,
    ErrorResponseDevDto,
} from './swagger.types';
import { NODE_ENV } from '../config/config';

export const ApiSwaggerEndpoint = (options: ApiSwaggerEndpointOptions) => {
    const {
        summary,
        description,
        consumes = [Consumes.JSON],
        auth = false,
        response,
        errorCodes = [],
    } = options;

    const decorators: MethodDecorator[] = [
        ApiOperation({ summary, description }),
        ApiConsumes(...consumes),
        ApiHeader({
            name: 'x-lang',
            required: false,
            description: 'Language code (e.g. en, fa). Overrides Accept-Language.',
            example: 'fa',
        }),
        ...(auth ? [ApiBearerAuth('Authorization')] : []),
    ];

    // Add extra models only if response.data is defined
    if (response.data) {
        decorators.unshift(
            ApiExtraModels(
                HttpResponseDto,
                response.data,
                PaginateMetaDto,
                PaginateLinksDto,
                ErrorResponseDto,
                PaginatedResponseDto,
                ErrorResponseDevDto,
            ),
        );
    } else {
        decorators.unshift(
            ApiExtraModels(
                HttpResponseDto,
                PaginateMetaDto,
                PaginateLinksDto,
                ErrorResponseDto,
                PaginatedResponseDto,
                ErrorResponseDevDto,
            ),
        );
    }

    // Add success response
    decorators.push(buildSuccessResponse(response));

    // Add pagination queries if response is paginated
    if (response.isPaginated) {
        decorators.push(...BuildApiPagination());
    }

    // Add error responses
    errorCodes.forEach((errorCode) => {
        decorators.push(buildErrorResponse(errorCode));
    });

    return applyDecorators(...decorators);
};

const buildSuccessResponse = (response: ApiSwaggerEndpointOptions['response']) => {
    const { status, data, isArray, isPaginated } = response;

    if (isArray && !isPaginated) {
        return ApiResponse({
            status,
            description: 'Successful response with array data',
            schema: {
                allOf: [
                    { $ref: getSchemaPath(HttpResponseDto) },
                    {
                        properties: {
                            statusCode: { type: 'number', example: status },
                            data: data
                                ? {
                                      type: 'array',
                                      items: { $ref: getSchemaPath(data) },
                                  }
                                : { type: 'array' },
                        },
                    },
                ],
            },
        });
    }

    if (isPaginated) {
        return ApiResponse({
            status,
            description: 'Successful response with paginated data',
            schema: {
                allOf: [
                    { $ref: getSchemaPath(HttpResponseDto) },
                    {
                        properties: {
                            statusCode: { type: 'number', example: status },
                            data: {
                                allOf: [
                                    { $ref: getSchemaPath(PaginatedResponseDto) },
                                    {
                                        properties: {
                                            data: data
                                                ? {
                                                      type: 'array',
                                                      items: { $ref: getSchemaPath(data) },
                                                  }
                                                : { type: 'array' },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });
    }

    return ApiResponse({
        status,
        description: 'Successful response with single object',
        schema: {
            allOf: [
                { $ref: getSchemaPath(HttpResponseDto) },
                {
                    properties: {
                        statusCode: { type: 'number', example: status },
                        data: data ? { $ref: getSchemaPath(data) } : {},
                    },
                },
            ],
        },
    });
};
const BuildApiPagination = (): MethodDecorator[] => {
    return [
        ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number for pagination' }),
        ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Number of items per page' }),
        ApiQuery({ name: 'sortBy', required: false, type: String, isArray: true, example: '[["id","DESC"]]', description: 'Sort by field and order as array of [field, direction] tuples' }),
        ApiQuery({ name: 'searchBy', required: false, type: [String], example: '["title","content"]', description: 'Fields to search in' }),
        ApiQuery({ name: 'search', required: false, type: String, example: 'search term', description: 'Search query string' }),
        ApiQuery({ name: 'filter', required: false, type: 'object', example: '{"status":"active"}', description: 'Filter conditions as object with column names as keys' }),
        ApiQuery({ name: 'select', required: false, type: [String], example: '["id","title"]', description: 'Fields to select' }),
        ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor for cursor-based pagination' }),
        ApiQuery({ name: 'withDeleted', required: false, type: Boolean, example: false, description: 'Include soft-deleted records' }),
        ApiQuery({ name: 'path', required: false, type: String, description: 'Path for pagination links' }),
    ];
};
const buildErrorResponse = (errorCode: number) => {
    const baseSchema: any = {
        allOf: [
            { $ref: getSchemaPath(ErrorResponseDto) },
            {
                properties: {
                    statusCode: { type: 'number', example: errorCode },
                },
            },
        ],
    };

    if (NODE_ENV === 'development') {
        baseSchema.allOf[1].properties.dev = { $ref: getSchemaPath(ErrorResponseDevDto) };
    }

    return ApiResponse({
        status: errorCode,
        description: 'Error response',
        schema: baseSchema,
    });
};
