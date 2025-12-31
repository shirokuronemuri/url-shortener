import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ProcessUrlIdPipe implements PipeTransform {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async transform(id: string) {
    const redirect = await this.db.url.findUnique({
      where: {
        url: `${this.config.get('host')}/${id}`,
      },
    });

    if (!redirect) {
      throw new NotFoundException();
    }

    return redirect;
  }
}
