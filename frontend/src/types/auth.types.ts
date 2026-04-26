import type { UserRole } from "./user.types";

export interface AuthenticatedUser {
  user_id: number;
  full_name: string;
  email: string | null;
  unique_code: string | null;
  username: string | null;
  shift_number: string | null;
  role: UserRole;
  status: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthenticatedUser;
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email?: string | null;
  unique_code?: string | null;
  username?: string | null;
  shift_number?: string | null;
  password: string;
  role: UserRole;
}

export interface AppSession {
  user_id: number;
  full_name: string;
  shift_number: string | null;
  unique_code: string;
  role: UserRole;
}

export interface UserSession {
  user_id: number;
  full_name: string;
  shift_number: string | null;
  unique_code: string;
}

export interface MechanicSession {
  user_id: number;
  full_name: string;
  unique_code: string;
  role: "mechanic";
}