import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { urlSchema } from './url.dto';
import { metaSchema } from 'src/modules/shared-dto/meta.dto';

export const urlArraySchema = z.object({
  data: z.array(urlSchema),
  meta: metaSchema,
});

export class UrlArrayDto extends createZodDto(urlArraySchema) {}
