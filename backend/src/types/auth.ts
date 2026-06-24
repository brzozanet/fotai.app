export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  turnstileToken: string;
  turnstileAction: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken: string;
  turnstileAction: string;
}

export interface AuthError {
  error: string;
}
