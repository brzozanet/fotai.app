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
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuthLogin: (user: AuthUser, token: string) => void;
  setAuthLogout: () => void;
}
