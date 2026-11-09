export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
}

export function paginate<T>(items: T[], requestedPage: number, pageSize: number): Page<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive integer");
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1), pageCount);
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageCount,
    total,
    start: total === 0 ? 0 : offset + 1,
    end: Math.min(offset + pageSize, total),
  };
}
