import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const positiveQueryInt = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}, z.number().int().positive());

export const queryParamSchema = z.object({
  page: positiveQueryInt.optional(),
  limit: positiveQueryInt.optional(),
  filter: z.string().trim().min(1).optional(),
});

export class QueryParamDto extends createZodDto(queryParamSchema) {}
