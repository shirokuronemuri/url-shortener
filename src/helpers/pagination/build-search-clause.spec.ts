import { Url } from 'src/services/database/generated/prisma/client';
import { buildSearchClause } from './build-search-clause';

type TestType = {
  tag: string;
  name: string;
  description: string;
};

describe('buildSearchClause()', () => {
  it('returns undefined if no filter passed', () => {
    expect(buildSearchClause<TestType>(undefined, [])).toBe(undefined);
  });

  it('returns undefined if filter present but no fields provided', () => {
    expect(buildSearchClause<TestType>('nyaa', [])).toBe(undefined);
  });

  it('returns OR array with field objects if filter is defined', () => {
    expect(
      buildSearchClause<TestType>('nyaa', ['name', 'description']),
    ).toStrictEqual({
      OR: [
        {
          name: {
            contains: 'nyaa',
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: 'nyaa',
            mode: 'insensitive',
          },
        },
      ],
    });
  });
});
