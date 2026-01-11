import z from 'zod';
import { metaSchema } from './meta';

type WrappedSchema<T extends z.ZodObject> = z.ZodObject<{
  data: T;
}>;
type PaginatedSchema<T extends z.ZodObject> = z.ZodObject<{
  data: z.ZodArray<T>;
  meta: typeof metaSchema;
}>;

export function singleResponse<T extends z.ZodObject>(
  schema: T,
): WrappedSchema<T> {
  return z.object({
    data: schema,
  });
}

export function paginatedResponse<T extends z.ZodObject>(
  schema: T,
): PaginatedSchema<T> {
  return z.object({
    data: z.array(schema),
    meta: metaSchema,
  });
}
