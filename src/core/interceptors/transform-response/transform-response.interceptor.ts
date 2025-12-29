import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        const isEmptyResponse = !res;
        const isObject =
          typeof res === 'object' && !Array.isArray(res) && res !== null;
        const hasMeta = isObject && 'data' in res && 'meta' in res;
        return {
          data: isEmptyResponse ? [] : hasMeta ? res.data : res,
          ...(hasMeta && { meta: res.meta }),
        };
      }),
    );
  }
}
