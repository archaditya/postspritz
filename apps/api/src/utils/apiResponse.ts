import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export class ApiResponse {
  /**
   * Send a standard successful response (200 OK by default).
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ): Response {
    const payload: StandardApiResponse<T> = {
      success: true,
      statusCode,
      message,
      data
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a standard resource created response (201 Created).
   */
  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Send a standard paginated response with comprehensive metadata.
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
    statusCode = 200
  ): Response {
    const totalPages = Math.ceil(total / Math.max(limit, 1));
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    const payload: StandardApiResponse<T[]> = {
      success: true,
      statusCode,
      message,
      data: items,
      meta
    };

    return res.status(statusCode).json(payload);
  }

  /**
   * Send a standard 204 No Content response.
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
