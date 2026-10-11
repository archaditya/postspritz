export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar_url: string | null;
    email_verified: boolean;
  };
  accessToken: string;
}

export interface PlatformCostEstimate {
  platform: string;
  is_paid: boolean;
  has_url: boolean;
  estimated_cost_usd: number;
}
