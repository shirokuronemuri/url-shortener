import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [CoreModule, TestModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
