import * as  Joi from 'joi';

export const envSchema = Joi.object({
    // Server
    PORT: Joi.number().min(1000).max(65535).required(),
    //swagger
    SWAGGER_ENABLED:Joi.boolean().default(false)

}).options({ abortEarly: false });
