import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TokenService {
  constructor(private readonly db: DatabaseService) {}

  async generateToken() {
    const token = crypto.randomBytes(64).toString('base64url');

    const hash = this.hashValue(token);
    await this.db.token.create({
      data: {
        hash,
      },
    });

    return { token };
  }

  hashValue(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
