import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';

@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const fallbackLanguage =
          configService.get<string>('i18n.defaultLanguage') ||
          configService.get<string>('i18n.fallbackLanguage') ||
          'fa';

        const watch =
          configService.get<boolean>('i18n.watch') ??
          process.env.NODE_ENV === 'development';
        const typesOutputPath =
          configService.get<string>('i18n.typesOutputPath') ||
          'src/core/i18n/generated/i18n.generated.ts';
        const translationPath =
          configService.get<string>('i18n.translationPath') ||
          join(process.cwd(), 'storage/i18n/translations');
        return {
          fallbackLanguage,
          loaderOptions: {
            path: translationPath,
            watch,
          },
          typesOutputPath,
          logging: true,
          throwOnMissingKey: false,
        };
      },

      resolvers:[
        {use:QueryResolver,options:['lang']},
        new HeaderResolver(['x-lang'])
      ]
    }),
  ],
})
export class I18nCoreModule {}
