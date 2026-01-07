import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { TokenModule } from '../token/token.module';
import { UrlClicksCron } from './url-clicks.cron';
import { IpSafetyService } from 'src/services/ip-safety/ip-safety.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';

@Module({
  imports: [TokenModule],
  controllers: [UrlController],
  providers: [UrlService, UrlClicksCron, IpSafetyService, IdGeneratorService],
})
export class UrlModule {}
