import { createZodDto } from 'nestjs-zod';
import { singleResponse } from 'src/modules/shared-dto/response-wrapper';
import { stringToDate } from 'src/modules/shared-dto/string-to-date';
import { z } from 'zod';

export const urlSchema = z.object({
  redirect: z.url(),
  url: z.string(),
  title: z.string().nonempty(),
  description: z.string().nullable().optional(),
  clicks: z.number().int().nonnegative(),
  createdAt: stringToDate,
  updatedAt: stringToDate,
});

const wrap = singleResponse(urlSchema);

export class UrlDto extends createZodDto(wrap, { codec: true }) {}
