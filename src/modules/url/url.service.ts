import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';
import { Response } from 'express';
import { QueryParamDto } from './dto/query-param.dto';
import { generatePaginationLinks } from 'src/helpers/generate-pagination-links';
import { CachedUrl } from './types/types';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UrlService {
  constructor(
    private readonly config: ConfigService,
    private readonly idGenerator: IdGeneratorService,
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async create(createUrlDto: CreateUrlDto, tokenId: string) {
    const id = this.idGenerator.generate(5);
    const response = await this.db.url.create({
      data: {
        ...createUrlDto,
        url: id,
        tokenId,
      },
    });
    return response;
  }

  async findAll(
    { limit = 10, page = 1, filter }: QueryParamDto,
    tokenId: string,
  ) {
    const whereClause = {
      where: {
        tokenId,
        OR: [
          {
            title: { contains: filter },
          },
          {
            description: { contains: filter },
          },
          {
            redirect: { contains: filter },
          },
        ],
      },
    };
    const results = await this.db.url.findMany({
      take: limit,
      skip: (page - 1) * limit,
      ...(filter && whereClause),
    });
    const totalCount = await this.db.url.count({ ...(filter && whereClause) });
    const totalPages = Math.ceil(totalCount / limit);
    const { nextPage, previousPage } = generatePaginationLinks({
      host: this.config.get('host') || '',
      limit,
      page,
      filter,
      totalPages,
    });
    return {
      data: results,
      meta: {
        totalCount,
        currentPage: page,
        totalPages,
        perPage: limit,
        nextPage,
        previousPage,
      },
    };
  }

  async findOne(id: string, tokenId: string) {
    const url = await this.findOrThrow(id, tokenId);
    return url;
  }

  async redirect(id: string, res: Response) {
    const cachedValue = await this.redis.getJSON<CachedUrl>(`redirect:${id}`);
    if (cachedValue) {
      return res.redirect(cachedValue.redirect);
    }

    const url = await this.findOrThrow(id);
    await this.redis.setJSON(
      `redirect:${id}`,
      { redirect: url.redirect },
      3600,
    );

    return res.redirect(url.redirect);
  }

  async update(id: string, updateUrlDto: UpdateUrlDto, tokenId: string) {
    const url = await this.findOrThrow(id, tokenId);
    const updatedUrl = await this.db.url.update({
      where: {
        id: url.id,
      },
      data: {
        ...updateUrlDto,
      },
    });
    await this.redis.client.del(`redirect:${id}`);
    return updatedUrl;
  }

  async remove(id: string, tokenId: string) {
    const url = await this.findOrThrow(id, tokenId);
    await this.db.url.delete({
      where: {
        id: url.id,
      },
    });
    await this.redis.client.del(`redirect:${id}`);
    await this.redis.client.del(`clicks:${id}`);
  }

  private async findOrThrow(id: string, tokenId?: string) {
    const url = await this.db.url.findUnique({
      where: {
        url: id,
        ...(tokenId && { tokenId }),
      },
    });
    if (!url) {
      throw new NotFoundException();
    }

    return url;
  }
}
