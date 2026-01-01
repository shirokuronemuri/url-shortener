import { Controller, Post } from '@nestjs/common';
import { TokenService } from './token.service';
import { ZodResponse } from 'nestjs-zod';
import { TokenDto } from './dto/token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ZodResponse({
    type: TokenDto,
    status: 201,
    description: 'Creates new auth token for usage in other requests',
  })
  @Post()
  generateToken() {
    return this.tokenService.generateToken();
  }
}
