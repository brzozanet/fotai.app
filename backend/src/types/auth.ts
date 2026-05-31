export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// export interface AuthResponse {
//   user: {
//     id: string;
//     name: string;
//     email: string;
//   };
//   token: string;
// }

export interface AuthError {
  error: string;
}
