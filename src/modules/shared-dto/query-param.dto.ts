import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { positiveQueryInt } from './positive-query-int';

export const queryParamSchema = z.object({
  page: positiveQueryInt.optional(),
  limit: positiveQueryInt.optional(),
  filter: z.string().trim().min(1).optional(),
});

export class QueryParamDto extends createZodDto(queryParamSchema) {}
