import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { isPrismaUniqueConstraintError } from './prisma-unique-constraint';

describe('isPrismaUniqueConstraintError()', () => {
  it('returns true when e is PrismaClientKnownRequestError and code is P2002', () => {
    const e = new PrismaClientKnownRequestError('error', {
      code: 'P2002',
      clientVersion: 'v1',
    });
    expect(isPrismaUniqueConstraintError(e)).toBe(true);
  });

  it('returns false when e is PrismaClientKnownRequestError and code is not P2002', () => {
    const e = new PrismaClientKnownRequestError('error', {
      code: 'somecode',
      clientVersion: 'v1',
    });
    expect(isPrismaUniqueConstraintError(e)).toBe(false);
  });

  it('returns false when e is not PrismaClientKnowRequestError', () => {
    const e = new Error('error');
    expect(isPrismaUniqueConstraintError(e)).toBe(false);
  });

  it('returns false when e is undefined', () => {
    expect(isPrismaUniqueConstraintError(undefined)).toBe(false);
  });

  it('returns false when e is simple object', () => {
    const e = {
      code: 'P2002',
    };
    expect(isPrismaUniqueConstraintError(e)).toBe(false);
  });
});
