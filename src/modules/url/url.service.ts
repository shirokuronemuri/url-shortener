import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';
import { Response } from 'express';

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
