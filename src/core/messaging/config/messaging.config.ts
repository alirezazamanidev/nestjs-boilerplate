import { registerAs } from "@nestjs/config";
import Joi from "joi";
import { ManifestConfig } from "src/core/config/config.loader";

 const messagingConfig=registerAs('messaging',()=>({
     enabled:
        String(process.env.MESSAGING_ENABLED ?? 'true').toLowerCase() !==
        'false' &&
        process.env.MESSAGING_ENABLED !== '0',
            driver:
        process.env.MESSAGING_DRIVER ||
        (String(process.env.RABBITMQ_ENABLED ?? 'false').toLowerCase() ===
            'true' ||
        process.env.RABBITMQ_ENABLED === '1'
            ? 'rabbit'
            : 'memory'),
}))

 const messagingSchema= Joi.object({
    MESSAGING_ENABLED: Joi.boolean()
        .truthy('true', '1', 'yes')
        .falsy('false', '0', 'no')
        .default(true),
    MESSAGING_DRIVER: Joi.string().valid('memory', 'rabbit').optional(),
});

export default new ManifestConfig(messagingConfig,messagingSchema);