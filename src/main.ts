import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { LoggerService } from './core/services/logger/logger.service';
import { TypedConfigService } from './config/typed-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(LoggerService));
  app.use(helmet());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Url shortener')
    .setDescription('Shorten your urls with this super convenient API!')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
      },
      'apiKey',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-admin-secret',
        in: 'header',
      },
      'adminSecret',
    )
    .addTag('Url', 'Manage and access short URLs')
    .addTag('Token', 'Get API token to access the rest of API')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const config = app.get<TypedConfigService>(TypedConfigService);
  const port = config.get('app.port');
  await app.listen(port);
}
void bootstrap();
