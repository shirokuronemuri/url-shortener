import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: TypedConfigService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers['x-admin-secret'];
    return token === this.config.get('app.adminSecret');
  }
}
