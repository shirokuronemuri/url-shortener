export const generatePaginationLinks = ({
  host,
  endpoint,
  limit,
  filter,
  page,
  totalPages,
}: {
  host: string;
  endpoint: string;
  limit: number;
  filter?: string;
  page: number;
  totalPages: number;
}): { nextPage: string | null; previousPage: string | null } => {
  const url = new URL(endpoint, host);
  url.searchParams.set('limit', limit.toString());
  if (filter) {
    url.searchParams.set('filter', filter);
  }
  url.searchParams.set('page', (page + 1).toString());
  const nextPage = page < totalPages ? url.href : null;
  url.searchParams.set('page', Math.min(page - 1, totalPages).toString());
  const previousPage = page > 1 && totalPages > 0 ? url.href : null;

  return {
    nextPage,
    previousPage,
  };
};
