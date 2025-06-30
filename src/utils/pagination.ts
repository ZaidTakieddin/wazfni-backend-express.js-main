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
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResult;
}

export interface UnpaginatedResponse<T> {
  data: T[];
}

// Union type for either paginated or unpaginated response
export type ListResponse<T> = PaginatedResponse<T> | UnpaginatedResponse<T>;

// Default pagination values
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_ORDER = 'desc';

/**
 * Parse pagination options from query parameters
 * Returns null if no pagination parameters are provided
 */
export const parsePaginationOptions = (
  query: any,
  defaultSortBy: string = 'createdAt',
): PaginationOptions | null => {
  const { page, limit, sortBy, sortOrder } = query;

  // Check if any pagination parameters are provided
  const hasPaginationParams = page !== undefined || limit !== undefined;

  if (!hasPaginationParams) {
    // Return null if no pagination is requested
    return null;
  }

  return {
    page: page ? Math.max(1, parseInt(page as string)) : 1,
    limit: limit ? Math.min(100, Math.max(1, parseInt(limit as string))) : 10,
    sortBy: (sortBy as string) || defaultSortBy,
    sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
  };
};

/**
 * Parse and validate pagination parameters - backward compatible version
 */
export function parsePaginationOptionsLegacy(
  options: PaginationOptions = {},
  defaultSortBy = 'createdAt',
): Required<PaginationOptions> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(Math.max(1, options.limit || 10), 100);
  const sortBy = options.sortBy || defaultSortBy;
  const sortOrder = options.sortOrder || 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number,
): PaginationResult => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Calculate skip value for database queries
 */
export const calculateSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> => {
  return {
    data,
    pagination: calculatePagination(page, limit, total),
  };
};

/**
 * Create unpaginated response
 */
export const createUnpaginatedResponse = <T>(
  data: T[],
): UnpaginatedResponse<T> => {
  return {
    data,
  };
};

/**
 * Create list response (paginated or unpaginated based on options)
 */
export const createListResponse = <T>(
  data: T[],
  paginationOptions: PaginationOptions | null,
  total?: number,
): ListResponse<T> => {
  if (paginationOptions && total !== undefined) {
    return createPaginatedResponse(
      data,
      paginationOptions.page!,
      paginationOptions.limit!,
      total,
    );
  }
  return createUnpaginatedResponse(data);
};

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
 * Create pagination schema for validation with specific sort fields
 */
export const createPaginationSchema = (sortFields: string[]) => {
  return z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .optional(),
    sortBy: z.enum(sortFields as [string, ...string[]]).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  });
};
