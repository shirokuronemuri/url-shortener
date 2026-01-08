import { generatePaginationLinks } from './generate-pagination-links';

describe('generatePaginationLinks()', () => {
  it('next and previous link are returned without filter if 1 < page < totalPages', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 2,
      totalPages: 3,
    };

    const links = generatePaginationLinks(params);
    expect(links.nextPage).not.toBeNull();
    expect(links.previousPage).not.toBeNull();
    const next = new URL(links.nextPage!);
    expect(next.searchParams.get('limit')).toBe('10');
    expect(next.searchParams.get('page')).toBe('3');
    expect(next.searchParams.get('filter')).toBeNull();
    const prev = new URL(links.previousPage!);
    expect(prev.searchParams.get('limit')).toBe('10');
    expect(prev.searchParams.get('page')).toBe('1');
    expect(prev.searchParams.get('filter')).toBeNull();
  });

  it('filter should be included if passed in', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 2,
      totalPages: 3,
      filter: 'fuwa',
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).not.toBeNull();
    expect(links.previousPage).not.toBeNull();
    const next = new URL(links.nextPage!);
    expect(next.searchParams.get('limit')).toBe('10');
    expect(next.searchParams.get('page')).toBe('3');
    expect(next.searchParams.get('filter')).toBe('fuwa');
    const prev = new URL(links.previousPage!);
    expect(prev.searchParams.get('limit')).toBe('10');
    expect(prev.searchParams.get('page')).toBe('1');
    expect(prev.searchParams.get('filter')).toBe('fuwa');
  });

  it('previousPage is null and nextPage is present if page=1 and < totalPages', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 1,
      totalPages: 3,
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).not.toBeNull();
    expect(links.previousPage).toBeNull();
    const next = new URL(links.nextPage!);
    expect(next.searchParams.get('limit')).toBe('10');
    expect(next.searchParams.get('page')).toBe('2');
  });

  it('previousPage is present and nextPage is null if page=totalPages and > 1', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 3,
      totalPages: 3,
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).toBeNull();
    expect(links.previousPage).not.toBeNull();
    const prev = new URL(links.previousPage!);
    expect(prev.searchParams.get('limit')).toBe('10');
    expect(prev.searchParams.get('page')).toBe('2');
  });

  it('both links should be null if on page=1 and totalPages=1', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 1,
      totalPages: 1,
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).toBeNull();
    expect(links.previousPage).toBeNull();
  });

  it('link to first previous existing page must exist if page > totalPages', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 5,
      totalPages: 2,
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).toBeNull();
    expect(links.previousPage).not.toBeNull();
    const prev = new URL(links.previousPage!);
    expect(prev.searchParams.get('page')).toBe('2');
    expect(prev.searchParams.get('limit')).toBe('10');
  });

  it('both lins should be null if totalPages=0', () => {
    const params = {
      host: 'http://localhost:3000',
      endpoint: '/url',
      limit: 10,
      page: 5,
      totalPages: 0,
    };
    const links = generatePaginationLinks(params);
    expect(links.nextPage).toBeNull();
    expect(links.previousPage).toBeNull();
  });
});
