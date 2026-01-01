import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from 'src/database/database.service';
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
    const hash = this.tokenService.hashValue(token);
    const matchedToken = await this.db.token.findUnique({
      where: {
        hash,
      },
    });
    if (!matchedToken) {
      return false;
    }
    req.tokenId = matchedToken.id;

    return true;
  }
}
