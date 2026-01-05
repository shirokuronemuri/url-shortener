type PageResults<T> = {
  data: T[];
  meta: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
  };
};

type FindManyArgs = {
  take: number;
  skip: number;
};

export const paginate = async <T>({
  page,
  limit,
  fetch,
  count,
}: {
  page: number;
  limit: number;
  fetch: (args: FindManyArgs) => Promise<T[]>;
  count: () => Promise<number>;
}): Promise<PageResults<T>> => {
  const data = await fetch({ take: limit, skip: (page - 1) * limit });
  const totalCount = await count();
  const totalPages = Math.ceil(totalCount / limit);
  return {
    data,
    meta: {
      totalCount,
      totalPages,
      currentPage: page,
      perPage: limit,
    },
  };
};
