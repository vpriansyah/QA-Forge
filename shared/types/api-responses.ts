// ═══════════════════════════════════════════════════════════
// QA Forge — API Response Types
// ═══════════════════════════════════════════════════════════

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ResponseMeta {
  request_id?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * API Error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Auth response types
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
