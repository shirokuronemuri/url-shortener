import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';
import { Response } from 'express';
import { QueryParamDto } from './dto/query-param.dto';
import { generatePaginationLinks } from 'src/helpers/generate-pagination-links';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CachedUrl } from './types/types';

@Injectable()
export class UrlService {
  constructor(
    private readonly config: ConfigService,
    private readonly idGenerator: IdGeneratorService,
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(createUrlDto: CreateUrlDto, tokenId: string) {
    const id = this.idGenerator.generate(5);
    const url = `${this.config.get('host')}/${id}`;
    const response = await this.db.url.create({
      data: {
        ...createUrlDto,
        url,
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
    const cachedValue = await this.cache.get<CachedUrl>(`redirect:${id}`);
    if (cachedValue) {
      return res.redirect(cachedValue.redirect);
    }

    const url = await this.db.url.findUnique({
      where: {
        url: `${this.config.get('host')}/${id}`,
      },
    });
    if (!url) {
      throw new NotFoundException();
    }
    await this.cache.set(
      `redirect:${id}`,
      { redirect: url.redirect },
      3600 * 1000,
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
    await this.cache.del(`redirect:${id}`);
    return updatedUrl;
  }

  async remove(id: string, tokenId: string) {
    const url = await this.findOrThrow(id, tokenId);
    await this.db.url.delete({
      where: {
        id: url.id,
      },
    });
    await this.cache.del(`redirect:${id}`);
  }

  private async findOrThrow(id: string, tokenId: string) {
    const url = await this.db.url.findUnique({
      where: {
        url: `${this.config.get('host')}/${id}`,
        tokenId,
      },
    });
    if (!url) {
      throw new NotFoundException();
    }

    return url;
  }
}
