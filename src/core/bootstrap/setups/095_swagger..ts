import { INestApplication } from '@nestjs/common';
import { Setup } from '../setup.base';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerThemeNameEnum } from 'swagger-themes/build/enums/swagger-theme-name';
import { SwaggerTheme } from 'swagger-themes/build/swagger-theme';

export default class SwaggerSetup extends Setup {
  name = 'swagger';
  order = 95;
  isEnabled(): boolean | Promise<boolean> {
    return process.env.SWAGGER_ENABLED === 'true';
  }
  setup(app: INestApplication): void | Promise<void> {
    const configService = app.get(ConfigService);

        const swaggerConfig = this.buildSwaggerConfig(configService);
        const document = SwaggerModule.createDocument(app, swaggerConfig, {});
        const swaggerPath = configService.get<string>(
            'swagger.path',
            'swagger',
        );
        const theme = new SwaggerTheme();
        const darkTheme = theme.getBuffer(SwaggerThemeNameEnum.DARK);

        SwaggerModule.setup(swaggerPath, app, document, {
            customCss: darkTheme,
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'none',
                filter: true,
                showRequestDuration: true,
            },
        });

  }

  private buildSwaggerConfig(configService: ConfigService) {
    const title = configService.get<string>(
      'swagger.title',
      'API Documentation',
    );
    const description = configService.get<string>(
      'swagger.description',
      'RESTful API documentation',
    );
    const version = configService.get<string>('swagger.version', '1.0.0');
    const tag = configService.get<string>('swagger.tag', 'API');

    return new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addTag(tag)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'Authorization',
      )
      .build();
  }
}
