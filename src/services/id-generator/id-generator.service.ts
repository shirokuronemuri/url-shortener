import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';

@Injectable()
export class IdGeneratorService {
  generate(length?: number) {
    return nanoid(length);
  }
}
