import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { AuthGuard } from './guards/auth/auth.guard';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';

@Module({
  controllers: [TokenController],
  providers: [AuthGuard, TokenService, IdGeneratorService],
  exports: [AuthGuard, TokenService],
})
export class TokenModule {}
