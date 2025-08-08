export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'admin';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

