export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponseSuccess {
  user: AuthUser;
  token: string;
}

export interface AuthResponseError {
  error: string;
}

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

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuthLogin: (user: AuthUser, token: string) => void;
  setAuthLogout: () => void;
}
