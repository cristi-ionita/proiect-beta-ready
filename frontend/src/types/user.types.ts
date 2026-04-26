export const USER_ROLE = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  MECHANIC: "mechanic",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type UserStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface UserItem {
  id: number;
  full_name: string;
  email: string | null;
  username: string | null;
  unique_code: string | null;
  shift_number: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
}

export interface RegistrationRequestItem {
  id: number;
  full_name: string;
  email: string | null;
  username: string | null;
  unique_code: string | null;
  shift_number: string | null;
  role: UserRole;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
}