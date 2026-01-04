import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { ZodResponse } from 'nestjs-zod';
import { IdParamDto } from '../shared-dto/id-param.dto';
import { AdminGuard } from './guards/admin/admin.guard';
import { ApiNoContentResponse, ApiSecurity } from '@nestjs/swagger';
import { NewTokenDto } from './dto/new-token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('')
  @ApiSecurity('adminSecret')
  @UseGuards(AdminGuard)
  @ZodResponse({
    type: NewTokenDto,
    status: 201,
    description: 'Creates new auth token for usage in other requests',
  })
  generateToken() {
    return this.tokenService.generateToken();
  }

  @Delete(':id')
  @ApiSecurity('adminSecret')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Revokes token, making it unusable',
  })
  revokeToken(@Param() { id }: IdParamDto) {
    return this.tokenService.revokeToken(id);
  }
}
