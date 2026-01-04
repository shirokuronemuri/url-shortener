import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const newTokenSchema = z.object({
  token: z.string(),
});

export class NewTokenDto extends createZodDto(newTokenSchema) {}
