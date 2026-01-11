import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const metaSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  perPage: z.number().int().positive(),
  nextPage: z.string().nullable(),
  previousPage: z.string().nullable(),
});

export class MetaDto extends createZodDto(metaSchema) {}
