import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/services/database/database.service';
import { Response } from 'express';
import { QueryParamDto } from '../shared-dto/query-param.dto';
import { generatePaginationLinks } from 'src/helpers/generate-pagination-links';
import { CachedUrl } from './types/types';
import { RedisService } from 'src/services/redis/redis.service';
import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma-unique-constraint';

@Injectable()
export class UrlService {
  constructor(
    private readonly config: ConfigService,
    private readonly idGenerator: IdGeneratorService,
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async create(createUrlDto: CreateUrlDto, tokenId: string) {
    if (await this.isPrivateIp(createUrlDto.redirect)) {
      throw new BadRequestException(
        'Specified redirect IP is in private range',
      );
    }
    const maxRetries = this.config.getOrThrow<number>(
      'url.urlGenerationMaxRetries',
    );
    const urlLength = this.config.getOrThrow<number>('url.urlLength');
    for (let i = 0; i < maxRetries; ++i) {
      const id = this.idGenerator.generate(urlLength);
      try {
        return this.db.url.create({
          data: {
            ...createUrlDto,
            url: id,
            tokenId,
          },
        });
      } catch (e) {
        if (isPrismaUniqueConstraintError(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new InternalServerErrorException('Failed to generate short url');
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
      host: this.config.getOrThrow('app.host'),
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
    await this.redis.client.incr(`clicks:${id}`);
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

  private async isPrivateIp(url: string): Promise<boolean> {
    try {
      let hostname = new URL(url).hostname;
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
      }
      const ips = await dns.lookup(hostname, { all: true });
      const privateRanges = [
        'private',
        'loopback',
        'linkLocal',
        'uniqueLocal',
        'unspecified',
        'carrierGradeNat',
      ];
      return ips.some((ip) => {
        const range = ipaddr.parse(ip.address).range();
        return privateRanges.includes(range);
      });
    } catch {
      return true;
    }
  }
}
