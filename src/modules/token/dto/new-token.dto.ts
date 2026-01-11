import { createZodDto } from 'nestjs-zod';
import { singleResponse } from 'src/modules/shared-dto/response-wrapper';
import z from 'zod';

const newTokenSchema = z.object({
  token: z.string(),
});

const wrap = singleResponse(newTokenSchema);

export class NewTokenDto extends createZodDto(wrap) {}
