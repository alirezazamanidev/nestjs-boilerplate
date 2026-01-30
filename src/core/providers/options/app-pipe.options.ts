import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function buildValidationPipe(cfg?: ConfigService) {
    const opt: ValidationPipeOptions = {
        whitelist:
            cfg?.get<boolean>('validation.whitelist') ??
            process.env.VALIDATION_WHITELIST !== 'false',
        forbidNonWhitelisted:
            cfg?.get<boolean>('validation.forbidNonWhitelisted') ??
            process.env.VALIDATION_FORBID_NON_WHITELIST === 'true',
        transform:
            cfg?.get<boolean>('validation.transform') ??
            process.env.VALIDATION_TRANSFORM !== 'false',
        transformOptions: {
            enableImplicitConversion:
                cfg?.get<boolean>('validation.implicitConversion') ??
                process.env.VALIDATION_IMPLICIT_CONVERSION !== 'false',
        },
        exceptionFactory: (errors) => errors,
    };

    return new ValidationPipe(opt);
}
