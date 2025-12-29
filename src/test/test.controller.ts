import { Controller, Get } from '@nestjs/common';
import { TestService } from './test.service';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller()
export class TestController {
  constructor(private readonly testService: TestService) {}
  @ApiOkResponse({
    description:
      'Uncached response, if <5s from previous request - cached response',
  })
  @Get()
  test() {
    return this.testService.test();
  }
}
