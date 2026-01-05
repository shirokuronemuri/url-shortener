import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigValues } from '.';

type Leaves<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never
        ? ''
        : `.${Leaves<T[K]>}`}`;
    }[keyof T]
  : never;

type LeafTypes<T, S extends string> = S extends `${infer T1}.${infer T2}`
  ? T1 extends keyof T
    ? LeafTypes<T[T1], T2>
    : never
  : S extends keyof T
    ? T[S]
    : never;

@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService) {}

  get<T extends Leaves<ConfigValues>>(
    propertyPath: T,
  ): LeafTypes<ConfigValues, T> {
    return this.config.get(propertyPath) as LeafTypes<ConfigService, T>;
  }
}
