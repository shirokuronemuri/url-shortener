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
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiSecurity,
} from '@nestjs/swagger';
import { NewTokenDto } from './dto/new-token.dto';
import { normalizeResponse } from 'src/helpers/response/normalize-response';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('')
  @ApiSecurity('adminSecret')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'create auth token' })
  @ZodResponse({
    type: NewTokenDto,
    status: 201,
    description: 'Creates new auth token for usage in other requests',
  })
  async generateToken() {
    const result = await this.tokenService.generateToken();
    return normalizeResponse(result);
  }

  @Delete(':id')
  @ApiSecurity('adminSecret')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'revoke existing token' })
  @ApiNoContentResponse({
    description: 'Revokes token, making it unusable',
  })
  revokeToken(@Param() { id }: IdParamDto) {
    return this.tokenService.revokeToken(id);
  }
}
