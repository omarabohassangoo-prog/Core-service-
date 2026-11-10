export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const parsePagination = (
  rawPage: unknown,
  rawLimit: unknown,
  defaultLimit = 15,
  maxLimit = 100
): PaginationParams => {
  const pageNum = typeof rawPage === 'string' ? parseInt(rawPage, 10) : Number(rawPage);
  const limitNum = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : Number(rawLimit);

  const page = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
  let limit = !isNaN(limitNum) && limitNum > 0 ? limitNum : defaultLimit;
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};

export const createPaginatedResult = <T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit) || 1;
  return {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
};
