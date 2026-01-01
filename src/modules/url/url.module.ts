import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { IdGeneratorModule } from 'src/services/id-generator/id-generator.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [IdGeneratorModule, TokenModule],
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}
