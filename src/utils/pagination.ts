import { z } from 'zod';

// Common pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResult;
}

// Default pagination values
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_ORDER = 'desc';

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationOptions(
  options: PaginationOptions = {},
  defaultSortBy = 'createdAt',
): Required<PaginationOptions> {
  const page = Math.max(1, options.page || DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, options.limit || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const sortBy = options.sortBy || defaultSortBy;
  const sortOrder = options.sortOrder || DEFAULT_SORT_ORDER;

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number,
): PaginationResult {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    pages,
    hasNext,
    hasPrev,
  };
}

/**
 * Calculate skip value for Prisma
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  const pagination = calculatePagination(page, limit, total);
  return { data, pagination };
}

/**
 * Common pagination query schema for validation
 */
export const paginationQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(MAX_LIMIT))
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Create pagination query schema with custom sortBy options
 */
export function createPaginationSchema(sortByOptions: string[]) {
  return z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(MAX_LIMIT))
      .optional(),
    sortBy: z.enum(sortByOptions as [string, ...string[]]).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  });
}
