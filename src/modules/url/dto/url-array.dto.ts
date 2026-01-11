import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { urlSchema } from './url.dto';
import { metaSchema } from 'src/modules/shared-dto/meta';
import { paginatedResponse } from 'src/modules/shared-dto/response-wrapper';

const urlArraySchema = paginatedResponse(urlSchema);

export class UrlArrayDto extends createZodDto(urlArraySchema, {
  codec: true,
}) {}
