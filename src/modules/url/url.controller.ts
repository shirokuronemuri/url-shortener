import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ZodResponse } from 'nestjs-zod';
import { UrlDto } from './dto/url.dto';
import type { Response } from 'express';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiSecurity,
  ApiTemporaryRedirectResponse,
} from '@nestjs/swagger';
import { IdParamDto } from '../shared-dto/id-param.dto';
import { QueryParamDto } from '../shared-dto/query-param.dto';
import { UrlArrayDto } from './dto/url-array.dto';
import { TokenId } from 'src/modules/token/decorators/token-id.decorator';
import { AuthGuard } from '../token/guards/auth/auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { normalizeResponse } from 'src/helpers/response/normalize-response';

@UseGuards(ThrottlerGuard)
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('url')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  @Throttle({ main: { ttl: 60 * 1000, limit: 10 } })
  @ApiOperation({ summary: 'create a short url' })
  @ZodResponse({
    type: UrlDto,
    status: 201,
    description: 'Creates new shortened url',
  })
  async create(@Body() createUrlDto: CreateUrlDto, @TokenId() tokenId: string) {
    const result = await this.urlService.create(createUrlDto, tokenId);
    return normalizeResponse(result);
  }

  @Get('url')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'get list of urls' })
  @ZodResponse({
    type: UrlArrayDto,
    status: 200,
    description: 'Returns all created urls',
  })
  findAll(@Query() queryParams: QueryParamDto, @TokenId() tokenId: string) {
    return this.urlService.findAll(queryParams, tokenId);
  }

  @Get('url/:id')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'get single url' })
  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns single url object by its short id',
  })
  async findOne(@Param() { id }: IdParamDto, @TokenId() tokenId: string) {
    const result = await this.urlService.findOne(id, tokenId);
    return normalizeResponse(result);
  }

  @Get(':id')
  @Throttle({ main: { ttl: 60 * 1000, limit: 100 } })
  @HttpCode(302)
  @ApiOperation({ summary: 'redirect by url' })
  @ApiTemporaryRedirectResponse({
    description: 'Redirects the user to the link stored in id',
  })
  redirect(@Param() { id }: IdParamDto, @Res() res: Response) {
    return this.urlService.redirect(id, res);
  }

  @Patch('url/:id')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'update url' })
  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns updated url object',
  })
  async update(
    @Param() { id }: IdParamDto,
    @Body() updateUrlDto: UpdateUrlDto,
    @TokenId() tokenId: string,
  ) {
    const result = await this.urlService.update(id, updateUrlDto, tokenId);
    return normalizeResponse(result);
  }

  @Delete('url/:id')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'delete the url' })
  @ApiNoContentResponse({
    description: 'Removes the url',
  })
  remove(@Param() { id }: IdParamDto, @TokenId() tokenId: string) {
    return this.urlService.remove(id, tokenId);
  }
}
