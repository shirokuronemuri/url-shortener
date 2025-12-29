import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { IdGeneratorModule } from 'src/services/id-generator/id-generator.module';

@Module({
  imports: [IdGeneratorModule],
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}
