import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/services/database/database.service';
import { Response } from 'express';
import { QueryParamDto } from '../shared-dto/query-param.dto';
import { generatePaginationLinks } from 'src/helpers/pagination/generate-pagination-links';
import { CachedUrl } from './types/types';
import { RedisService } from 'src/services/redis/redis.service';
import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma/prisma-unique-constraint';
import { TypedConfigService } from 'src/config/typed-config.service';
import { buildSearchClause } from 'src/helpers/pagination/build-search-clause';
import { Url } from 'src/services/database/generated/prisma/client';
import { paginate } from 'src/helpers/pagination/paginate';

@Injectable()
export class UrlService {
  constructor(
    private readonly config: TypedConfigService,
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
    const maxRetries = this.config.get('url.urlGenerationMaxRetries');
    const urlLength = this.config.get('url.urlLength');
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
    const where = {
      tokenId,
      ...buildSearchClause<Url>(filter, ['title', 'description', 'redirect']),
    };

    const pageResults = await paginate<Url>({
      page,
      limit,
      fetch: (args) => this.db.url.findMany({ ...args, where }),
      count: () => this.db.url.count({ where }),
    });

    const links = generatePaginationLinks({
      host: this.config.get('app.host'),
      limit,
      page,
      filter,
      totalPages: pageResults.meta.totalPages,
    });

    return {
      data: pageResults.data,
      meta: {
        ...pageResults.meta,
        ...links,
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
