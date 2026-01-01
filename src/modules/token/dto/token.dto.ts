import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const tokenSchema = z.object({
  token: z.string(),
});

export class TokenDto extends createZodDto(tokenSchema) {}
