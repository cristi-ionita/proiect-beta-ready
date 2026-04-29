export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  MECHANIC: "mechanic",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ROLE_SET: Record<Role, true> = {
  admin: true,
  employee: true,
  mechanic: true,
};

export function isRole(value: string): value is Role {
  return value in ROLE_SET;
}