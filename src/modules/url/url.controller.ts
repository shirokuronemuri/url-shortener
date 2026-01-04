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
import { convertDates } from 'src/helpers/convert-dates';
import type { Response } from 'express';
import {
  ApiNoContentResponse,
  ApiSecurity,
  ApiTemporaryRedirectResponse,
} from '@nestjs/swagger';
import { IdParamDto } from '../shared-dto/id-param.dto';
import { QueryParamDto } from '../shared-dto/query-param.dto';
import { UrlArrayDto } from './dto/url-array.dto';
import { TokenId } from 'src/decorators/token-id.decorator';
import { AuthGuard } from '../token/guards/auth/auth.guard';

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @ZodResponse({
    type: UrlDto,
    status: 201,
    description: 'Creates new shortened url',
  })
  @Post('url')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  create(@Body() createUrlDto: CreateUrlDto, @TokenId() tokenId: string) {
    return this.urlService.create(createUrlDto, tokenId).then(convertDates);
  }

  @ZodResponse({
    type: UrlArrayDto,
    status: 200,
    description: 'Returns all created urls',
  })
  @Get('url')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  async findAll(
    @Query() queryParams: QueryParamDto,
    @TokenId() tokenId: string,
  ) {
    const result = await this.urlService.findAll(queryParams, tokenId);
    return {
      data: result.data.map((url) => convertDates(url)),
      meta: result.meta,
    };
  }

  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns single url object by its short id',
  })
  @Get('url/:id')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  findOne(@Param() { id }: IdParamDto, @TokenId() tokenId: string) {
    return this.urlService.findOne(id, tokenId).then(convertDates);
  }

  @ApiTemporaryRedirectResponse({
    description: 'Redirects the user to the link stored in id',
  })
  @HttpCode(301)
  @Get(':id')
  redirect(@Param() { id }: IdParamDto, @Res() res: Response) {
    return this.urlService.redirect(id, res);
  }

  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns updated url object',
  })
  @Patch('url/:id')
  @ApiSecurity('apiKey')
  @UseGuards(AuthGuard)
  update(
    @Param() { id }: IdParamDto,
    @Body() updateUrlDto: UpdateUrlDto,
    @TokenId() tokenId: string,
  ) {
    return this.urlService.update(id, updateUrlDto, tokenId).then(convertDates);
  }

  @ApiNoContentResponse({
    description: 'Removes the url',
  })
  @Delete('url/:id')
  @ApiSecurity('apiKey')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  remove(@Param() { id }: IdParamDto, @TokenId() tokenId: string) {
    return this.urlService.remove(id, tokenId);
  }
}
