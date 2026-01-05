import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export const isPrismaUniqueConstraintError = (e: unknown) =>
  e instanceof PrismaClientKnownRequestError && e.code === 'P2002';
