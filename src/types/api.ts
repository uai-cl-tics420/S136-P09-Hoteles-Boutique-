export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: { id: string; email: string; role: string };
  requiresOtp?: boolean;
  tempSessionId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface OtpVerifyRequest {
  token: string;
  tempSessionId?: string;
}

export interface CreateBookingRequest {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  specialRequests?: string;
  extras?: { extraServiceId: string; quantity: number }[];
}