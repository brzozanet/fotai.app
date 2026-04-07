export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
