import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const urlSchema = z.object({
  redirect: z.url(),
  url: z.url(),
  title: z.string().nonempty(),
  description: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class UrlDto extends createZodDto(urlSchema) {}
