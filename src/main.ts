import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { LoggerService } from './core/services/logger/logger.service';
import { TypedConfigService } from './config/typed-config.service';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(LoggerService));
  app.use(helmet());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Url shortener')
    .setDescription(
      `Shorten your urls with this super convenient API! 
      Url clicks are counted with redis and flushed into db with a cron job.`,
    )
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
    .addTag(
      'Token',
      'Manage API tokens for url operations (admin access required)',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 5,
    },
  });

  const config = app.get<TypedConfigService>(TypedConfigService);
  const port = config.get('app.port');
  app.set('trust proxy', 'loopback');
  await app.listen(port);
}
void bootstrap();
