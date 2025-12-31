import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { urlSchema } from './url.dto';

export const urlArraySchema = z.object({
  data: z.array(urlSchema),
  meta: z.object({
    totalCount: z.number().int().nonnegative(),
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    perPage: z.number().int().positive(),
    nextPage: z.string().nullable(),
    previousPage: z.string().nullable(),
  }),
});

export class UrlArrayDto extends createZodDto(urlArraySchema) {}
