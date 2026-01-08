import { paginate } from './paginate';

describe('paginate()', () => {
  it('calls fetch and count and returns right meta when page=1 and totalcount%limit=0', async () => {
    const totalCount = 20;
    const args = {
      page: 1,
      limit: 10,
      fetch: jest.fn().mockReturnValue('data'),
      count: jest.fn().mockReturnValue(totalCount),
    };
    const result = await paginate(args);
    expect(result.data).toBe('data');
    expect(result.meta).toStrictEqual({
      totalCount,
      totalPages: 2,
      currentPage: args.page,
      perPage: args.limit,
    });
    expect(args.count).toHaveBeenCalledTimes(1);
    expect(args.fetch).toHaveBeenCalledWith({
      take: args.limit,
      skip: 0,
    });
  });

  it('returns right meta when page=2 and totalcount%limit>0', async () => {
    const totalCount = 11;
    const args = {
      page: 2,
      limit: 10,
      fetch: jest.fn().mockReturnValue('data'),
      count: jest.fn().mockReturnValue(totalCount),
    };
    const result = await paginate(args);
    expect(result.data).toBe('data');
    expect(result.meta).toStrictEqual({
      totalCount,
      totalPages: 2,
      currentPage: args.page,
      perPage: args.limit,
    });
    expect(args.count).toHaveBeenCalledTimes(1);
    expect(args.fetch).toHaveBeenCalledWith({
      take: args.limit,
      skip: 10,
    });
  });

  it('works with totalCount = 0 and empty array', async () => {
    const totalCount = 0;
    const args = {
      page: 1,
      limit: 10,
      fetch: jest.fn().mockReturnValue([]),
      count: jest.fn().mockReturnValue(totalCount),
    };
    const result = await paginate(args);
    expect(result.data).toStrictEqual([]);
    expect(result.meta.totalPages).toBe(0);
  });
});
