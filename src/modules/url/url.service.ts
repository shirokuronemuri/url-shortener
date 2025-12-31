import { Injectable } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';
import type { Url } from 'src/database/generated/prisma/client';

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

  async findAll() {
    return await this.db.url.findMany();
  }

  // async findOne(url: string) {
  //   const result = await this.db.url.findUnique({
  //     where: {
  //       url,
  //     },
  //   });
  //   if (!result) throw new Error();
  //   return result;
  // }

  async update(url: Url, updateUrlDto: UpdateUrlDto) {
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

  async remove(url: Url) {
    await this.db.url.delete({
      where: {
        id: url.id,
      },
    });
  }
}
