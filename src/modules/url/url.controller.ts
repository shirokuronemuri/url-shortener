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
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ZodResponse } from 'nestjs-zod';
import { UrlDto } from './dto/url.dto';
import { convertDates } from 'src/helpers/convert-dates';
import type { Url } from 'src/database/generated/prisma/client';
import type { Response } from 'express';
import { ProcessUrlIdPipe } from './pipes/process-url-id/process-url-id.pipe';
import {
  ApiNoContentResponse,
  ApiTemporaryRedirectResponse,
} from '@nestjs/swagger';

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
    type: [UrlDto],
    status: 200,
    description: 'Returns all created urls',
  })
  @Get('url')
  findAll() {
    return this.urlService
      .findAll()
      .then((urls) => urls.map((url) => convertDates(url)));
  }

  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns single url object by its short id',
  })
  @Get('url/:id')
  findOne(@Param('id', ProcessUrlIdPipe) url: Url) {
    return convertDates(url);
    // return this.urlService.findOne(url).then(convertDates);
  }

  @ApiTemporaryRedirectResponse({
    description: 'Redirects the user to the link stored in id',
  })
  @HttpCode(301)
  @Get(':id')
  redirect(
    @Param('id', ProcessUrlIdPipe) url: Url,
    @Res() res: Response,
  ): void {
    return res.redirect(url.redirect);
  }

  @ZodResponse({
    type: UrlDto,
    status: 200,
    description: 'Returns updated url object',
  })
  @Patch('url/:id')
  update(
    @Param('id', ProcessUrlIdPipe) url: Url,
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    return this.urlService.update(url, updateUrlDto).then(convertDates);
  }

  @ApiNoContentResponse({
    description: 'Removes the url',
  })
  @Delete('url/:id')
  @HttpCode(204)
  remove(@Param('id', ProcessUrlIdPipe) url: Url) {
    return this.urlService.remove(url);
  }
}
