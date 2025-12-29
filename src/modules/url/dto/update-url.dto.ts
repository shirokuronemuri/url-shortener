import { createZodDto } from 'nestjs-zod';
import { createUrlSchema } from './create-url.dto';

const updateUrlSchema = createUrlSchema.partial();

export class UpdateUrlDto extends createZodDto(updateUrlSchema) {}
