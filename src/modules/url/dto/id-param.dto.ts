import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const idParamSchema = z.object({
  id: z.string(),
});

export class IdParamDto extends createZodDto(idParamSchema) {}
