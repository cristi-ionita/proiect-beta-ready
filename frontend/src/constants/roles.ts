export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  MECHANIC: "mechanic",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isRole(value: string): value is Role {
  return Object.values(ROLES).includes(value as Role);
}