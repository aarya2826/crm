export const PAGE_SIZE = 10;

export interface ListQuery {
  search: string;
  page: number;
  sort: string;
  dir: "asc" | "desc";
}

export interface PagedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  dir: "asc" | "desc";
}

export function parsePage(value: string | undefined, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function parseDir(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

export function skipTake(page: number, pageSize = PAGE_SIZE): { skip: number; take: number } {
  const current = Math.max(1, page);
  return { skip: (current - 1) * pageSize, take: pageSize };
}
