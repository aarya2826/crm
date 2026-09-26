export const PAGE_SIZE = 10;

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = PAGE_SIZE
): { rows: T[]; totalPages: number; current: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;

  return {
    rows: items.slice(start, start + pageSize),
    totalPages,
    current,
  };
}
