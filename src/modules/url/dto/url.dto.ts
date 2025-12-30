import { createZodDto } from 'nestjs-zod';
import { defaultSchema } from 'src/helpers/default-schema';
import { z } from 'zod';

export const urlSchema = defaultSchema.extend({
  redirect: z.url(),
  url: z.url(),
  title: z.string().nonempty(),
  description: z.string().nullable().optional(),
});

export class UrlDto extends createZodDto(urlSchema) {}
