import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUrlSchema = z.object({
  redirect: z.url(),
  title: z.string().nonempty(),
  description: z.string().optional(),
});

export class CreateUrlDto extends createZodDto(createUrlSchema) {}
