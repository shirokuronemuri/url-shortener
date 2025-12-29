import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { UrlModule } from './modules/url/url.module';

@Module({
  imports: [CoreModule, UrlModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
