export type AppError = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: AppError;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};
