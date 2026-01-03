import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { IdGeneratorModule } from 'src/services/id-generator/id-generator.module';
import { TokenModule } from '../token/token.module';
import { UrlClicksCron } from './url-clicks.cron';

@Module({
  imports: [IdGeneratorModule, TokenModule],
  controllers: [UrlController],
  providers: [UrlService, UrlClicksCron],
})
export class UrlModule {}
