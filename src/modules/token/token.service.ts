import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma-unique-constraint';
import { DatabaseService } from 'src/services/database/database.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly db: DatabaseService,
    private readonly idGenerator: IdGeneratorService,
    private readonly config: ConfigService,
  ) {}

  async generateToken() {
    const secret = crypto.randomBytes(64).toString('base64url');
    const hash = this.hashValue(secret);

    const maxRetries = this.config.getOrThrow<number>(
      'url.tokenGenerationMaxRetries',
    );
    const tokenLength = this.config.getOrThrow<number>('url.tokenLength');
    for (let i = 0; i < maxRetries; ++i) {
      const id = this.idGenerator.generate(tokenLength);
      try {
        await this.db.token.create({
          data: {
            id,
            hash,
          },
        });
        return { token: `${id}.${secret}` };
      } catch (e) {
        if (isPrismaUniqueConstraintError(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new InternalServerErrorException('Failed to generate new token');
  }

  hashValue(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async revokeToken(id: string) {
    return this.db.token.update({ where: { id }, data: { isRevoked: true } });
  }
}
