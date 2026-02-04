import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { ManifestConfig } from '../config/config.loader';

const i18nConfig = registerAs('i18n', () => ({
  defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'fa',
  fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || 'fa',
  watch: true,
  typesOutputPath:
    process.env.I18N_TYPES_OUTPUT_PATH ||
    'src/core/i18n/generated/i18n.generated.ts',
}));

const i18nSchema = Joi.object({
  I18N_DEFAULT_LANGUAGE: Joi.string()
    // .default('fa')
    .description('Default language for i18n'),
  I18N_FALLBACK_LANGUAGE: Joi.string()
    // .default('fa')
    .description('Fallback language when translation key is missing'),
  I18N_WATCH: Joi.boolean()
    .default(true)
    .description('Enable live reloading of translation files in development'),
  I18N_TYPES_OUTPUT_PATH: Joi.string()
    .default('src/core/i18n/generated/i18n.generated.ts')
    .description('Output path for generated TypeScript types'),
});

export default new ManifestConfig(i18nConfig,i18nSchema)