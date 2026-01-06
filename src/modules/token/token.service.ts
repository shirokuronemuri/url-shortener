import { Injectable, InternalServerErrorException } from '@nestjs/common';
import crypto from 'node:crypto';
import { TypedConfigService } from 'src/config/typed-config.service';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma/prisma-unique-constraint';
import { DatabaseService } from 'src/services/database/database.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly db: DatabaseService,
    private readonly idGenerator: IdGeneratorService,
    private readonly config: TypedConfigService,
  ) {}

  async generateToken() {
    const secret = crypto.randomBytes(64).toString('base64url');
    const hash = this.hashValue(secret);

    const maxTries = this.config.get('url.tokenGenerationMaxTries');
    const tokenLength = this.config.get('url.tokenIdLength');
    for (let i = 0; i < maxTries; ++i) {
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
