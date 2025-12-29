import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { UrlModule } from './modules/url/url.module';
import { IdGeneratorModule } from './services/id-generator/id-generator.module';

@Module({
  imports: [CoreModule, UrlModule, IdGeneratorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
