import { Response } from 'express';
import { NODE_ENV } from '../config/config';
import { ClsServiceManager } from 'nestjs-cls';
import { ValidationError } from 'class-validator';
import { LoggerManager } from './../../core/logger/logger.manager';
import {
    Catch,
    HttpStatus,
    ArgumentsHost,
    HttpException,
    ExceptionFilter,
    InternalServerErrorException,
    UnprocessableEntityException,
} from '@nestjs/common';

type TFormattedValidationError = {
    [key: string]: string[] | TFormattedValidationError;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const logger = LoggerManager.resolveLogger({
            context: 'GlobalExceptionFilter',
        });

        let responseException: HttpException;

        // Handle validation errors from class-validator
        if (this.isArrayOfValidationError(exception)) {
            responseException = this.handleValidationException(exception);
            logger.error({
                eventName: 'GlobalExceptionFilter.validationError',
                body: {
                    errors: this.formatValidationError(exception),
                },
            });
        }

        // Handle standard HttpExceptions
        else if (exception instanceof HttpException) {
            responseException = this.handleHttpException(exception);
            logger.error({
                eventName: 'GlobalExceptionFilter.httpException',
                body: {
                    status: responseException.getStatus(),
                    message: responseException.message,
                },
            });
        }

        // Handle unexpected errors
        else {
            responseException = this.handleUnexpectedErrors();
            logger.error({
                eventName: 'GlobalExceptionFilter.unexpectedError',
                body: {
                    error:
                        exception instanceof Error
                            ? exception.message
                            : exception,
                    stack:
                        exception instanceof Error
                            ? exception.stack
                            : undefined,
                },
            });
        }

        const status = responseException.getStatus();
        const response = this.buildResponse(exception, responseException);

        res.status(status).json(response);
    }

    private buildResponse(rawException: unknown, httpException: HttpException) {
        const response = httpException.getResponse();

        const baseResponse: Record<string, unknown> = {
            requestId: this.getRequestId(),
            ...(typeof response === 'string'
                ? { message: response }
                : response),
        };

        if (NODE_ENV === 'development') {
            const isErrorInst = rawException instanceof Error;

            baseResponse.dev = isErrorInst
                ? {
                      name: rawException.name,
                      message: rawException.message,
                      stack: rawException.stack,
                      cause: rawException.cause ?? null,
                  }
                : rawException;
        }

        return baseResponse;
    }

    private isArrayOfValidationError(
        exception: unknown,
    ): exception is ValidationError[] {
        return (
            Array.isArray(exception) &&
            exception.every((e) => e instanceof ValidationError)
        );
    }

    /**
     * Recursively formats validation errors from class-validator into a consistent object structure.
     * This ensures that both top-level and nested (child) property errors are readable and standardized.
     *
     * @param errors - Array of ValidationError objects returned by class-validator
     * @returns Record<string, string[] | object> - Formatted errors keyed by property name
     */
    private formatValidationError(errors: ValidationError[]) {
        const formattedErrors: TFormattedValidationError = {};
        

        errors.forEach((error: ValidationError) => {
            const { constraints, children } = error;

            // Handle direct validation errors for the current property
            // Example: @IsNotEmpty, @IsEmail, etc.
            if (constraints) {
                if (constraints.isMongoId) {
                    constraints.isMongoId = `${error.value} is not valid id.`;
                }

                // Convert constraint messages to an array for easy consumption in API responses
                formattedErrors[error.property] = Object.values(constraints);

                // If the parent has its own validation errors (constraints),
                // skip processing nested errors to avoid a complicated response structure.
                return;
            }

            // Handle nested validation errors (e.g., errors inside nested objects or arrays)
            if (children && children.length >= 1) {
                // Recursively format child errors to preserve structure
                formattedErrors[error.property] =
                    this.formatValidationError(children);
            }
        });

        return formattedErrors;
    }

    private handleValidationException(errors: ValidationError[]) {
    
        const formattedErrors = this.formatValidationError(errors);
        const exceptionInst = new UnprocessableEntityException({
            message:'Validation error happened',
            error: 'Unprocessable Entity',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: formattedErrors,
        });

        return exceptionInst;
    }

    private handleHttpException(exception: HttpException) {
        return exception;
    }

    private handleUnexpectedErrors() {
        
        const internalException = new InternalServerErrorException(
            'Server Error'
        );

        return internalException;
    }

    private getRequestId = (): string => {
        return ClsServiceManager.getClsService().get<string>('requestId');
    };
}
