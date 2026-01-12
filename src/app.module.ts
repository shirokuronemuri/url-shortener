import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { UrlModule } from './modules/url/url.module';
import { TokenModule } from './modules/token/token.module';
import { IpSafetyService } from './services/ip-safety/ip-safety.service';

@Module({
  imports: [CoreModule, UrlModule, TokenModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
