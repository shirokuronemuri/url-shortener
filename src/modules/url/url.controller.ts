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
  ApiTemporaryRedirectResponse,
} from '@nestjs/swagger';
import { IdParamDto } from './dto/id-param.dto';
import { QueryParamDto } from './dto/query-param.dto';
import { UrlArrayDto } from './dto/url-array.dto';

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @ZodResponse({
    type: UrlDto,
    status: 201,
    description: 'Creates new shortened url',
  })
  @Post('url')
  create(@Body() createUrlDto: CreateUrlDto) {
    return this.urlService.create(createUrlDto).then(convertDates);
  }

  @ZodResponse({
    type: UrlArrayDto,
    status: 200,
    description: 'Returns all created urls',
  })
  @Get('url')
  async findAll(@Query() queryParams: QueryParamDto) {
    const result = await this.urlService.findAll(queryParams);
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
  findOne(@Param() { id }: IdParamDto) {
    return this.urlService.findOne(id).then(convertDates);
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
  update(@Param() { id }: IdParamDto, @Body() updateUrlDto: UpdateUrlDto) {
    return this.urlService.update(id, updateUrlDto).then(convertDates);
  }

  @ApiNoContentResponse({
    description: 'Removes the url',
  })
  @Delete('url/:id')
  @HttpCode(204)
  remove(@Param() { id }: IdParamDto) {
    return this.urlService.remove(id);
  }
}
