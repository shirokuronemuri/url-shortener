import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { AuthGuard } from './guards/auth/auth.guard';
import { IdGeneratorModule } from 'src/services/id-generator/id-generator.module';

@Module({
  imports: [IdGeneratorModule],
  controllers: [TokenController],
  providers: [AuthGuard, TokenService],
  exports: [AuthGuard, TokenService],
})
export class TokenModule {}
