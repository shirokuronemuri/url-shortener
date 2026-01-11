import { MetaDto } from 'src/modules/shared-dto/meta';

type WrappedResponse<T> = {
  data: T;
  meta?: any;
};

type PaginatedResponse<T, M = any> = {
  data: T;
  meta: M;
};

export function normalizeResponse(res: null | undefined): { data: [] };
export function normalizeResponse<T, M>(
  res: PaginatedResponse<T, M>,
): PaginatedResponse<T, M>;
export function normalizeResponse<T>(res: T): WrappedResponse<T>;
export function normalizeResponse(res: any): any {
  const isEmptyResponse = !res;
  const isObject =
    typeof res === 'object' && !Array.isArray(res) && res !== null;
  const hasMeta = isObject && 'data' in res && 'meta' in res;
  return {
    data: isEmptyResponse ? [] : hasMeta ? res.data : res,
    ...(hasMeta && { meta: res.meta }),
  };
}
