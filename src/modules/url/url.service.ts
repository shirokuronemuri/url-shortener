import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';
import { Response } from 'express';
import { QueryParamDto } from './dto/query-param.dto';
import { generatePaginationLinks } from 'src/helpers/generate-pagination-links';

@Injectable()
export class UrlService {
  constructor(
    private readonly config: ConfigService,
    private readonly idGenerator: IdGeneratorService,
    private readonly db: DatabaseService,
  ) {}

  async create(createUrlDto: CreateUrlDto) {
    const id = this.idGenerator.generate(5);
    const url = `${this.config.get('host')}/${id}`;
    const response = await this.db.url.create({
      data: {
        ...createUrlDto,
        url,
      },
    });
    return response;
  }

  async findAll({ limit = 10, page = 1, filter }: QueryParamDto) {
    const whereClause = {
      where: {
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

  async findOne(id: string) {
    const url = await this.findOrThrow(id);
    return url;
  }

  async redirect(id: string, res: Response) {
    const url = await this.findOrThrow(id);
    res.redirect(url.redirect);
  }

  async update(id: string, updateUrlDto: UpdateUrlDto) {
    const url = await this.findOrThrow(id);
    const updatedUrl = await this.db.url.update({
      where: {
        id: url.id,
      },
      data: {
        ...updateUrlDto,
      },
    });
    return updatedUrl;
  }

  async remove(id: string) {
    const url = await this.findOrThrow(id);
    await this.db.url.delete({
      where: {
        id: url.id,
      },
    });
  }

  async findOrThrow(id: string) {
    const url = await this.db.url.findUnique({
      where: {
        url: `${this.config.get('host')}/${id}`,
      },
    });
    if (!url) {
      throw new NotFoundException();
    }

    return url;
  }
}
