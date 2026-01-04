import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from 'src/services/database/database.service';
import { TokenService } from 'src/modules/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers['x-api-key'];
    if (!token || Array.isArray(token)) {
      return false;
    }
    const [id, secret] = token.split('.');
    if (!id || !secret) {
      return false;
    }

    const hash = this.tokenService.hashValue(secret);
    const matchedToken = await this.db.token.findUnique({
      where: {
        id,
      },
    });
    if (!matchedToken || hash !== matchedToken.hash) {
      return false;
    }
    req.tokenId = id;

    return true;
  }
}
