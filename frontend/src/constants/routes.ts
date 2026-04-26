import { ROLES } from "./roles";

export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
  },

  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    VEHICLES: "/admin/vehicles",
    ISSUES: "/admin/issues",
    DOCUMENTS: "/admin/documents",
    ASSIGNMENTS: "/admin/assignments",
  },

  EMPLOYEE: {
    ROOT: "/employee",
    DASHBOARD: "/employee",
    PROFILE: "/employee/profile",
    DOCUMENTS: "/employee/documents",
    VEHICLE: "/employee/my-vehicle",
    ISSUES: "/employee/issues",
    LEAVE: "/employee/leave",
    LEAVE_CREATE: "/employee/leave/create",
    LEAVE_HISTORY: "/employee/leave/history",
  },

  MECHANIC: {
    ROOT: "/mechanic",
    DASHBOARD: "/mechanic/dashboard",
    ISSUES: "/mechanic/issues",
  },
} as const;

export function getDefaultRouteByRole(role: string) {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN.DASHBOARD;
    case ROLES.EMPLOYEE:
      return ROUTES.EMPLOYEE.DASHBOARD;
    case ROLES.MECHANIC:
      return ROUTES.MECHANIC.DASHBOARD;
    default:
      return ROUTES.PUBLIC.LOGIN;
  }
}