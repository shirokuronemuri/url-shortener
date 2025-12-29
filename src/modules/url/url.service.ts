import { Injectable } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { DatabaseService } from 'src/database/database.service';

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

  findAll() {
    return `This action returns all url`;
  }

  findOne(id: number) {
    return `This action returns a #${id} url`;
  }

  update(id: number, updateUrlDto: UpdateUrlDto) {
    return `This action updates a #${id} url`;
  }

  remove(id: number) {
    return `This action removes a #${id} url`;
  }
}
