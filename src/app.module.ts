import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { UrlModule } from './modules/url/url.module';
import { IdGeneratorModule } from './services/id-generator/id-generator.module';
import { TokenModule } from './modules/token/token.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CoreModule,
    ScheduleModule.forRoot(),
    UrlModule,
    IdGeneratorModule,
    TokenModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
