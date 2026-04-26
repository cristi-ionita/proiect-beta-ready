export const QUERY_KEYS = {
  AUTH: {
    CURRENT_USER: ["auth", "current-user"],
  },

  PROFILE: {
    SUMMARY: ["profile", "summary"],
    PERSONAL: ["profile", "personal"],
  },

  USERS: {
    ALL: ["users"],
    DETAILS: (id: string) => ["users", id],
    ACTIVE: ["users", "active"],
  },

  VEHICLES: {
    ALL: ["vehicles"],
    DETAILS: (id: string) => ["vehicles", id],
    MY: ["vehicles", "my"],
    UNASSIGNED: ["vehicles", "unassigned"],
  },

  ASSIGNMENTS: {
    ALL: ["assignments"],
    MY: ["assignments", "my"],
  },

  ISSUES: {
    ALL: ["issues"],
    MY: ["issues", "my"],
    ACTIVE: ["issues", "active"],
    DETAILS: (id: string) => ["issues", id],
  },

  DOCUMENTS: {
    MY: ["documents", "my"],
    USER: (userId: string) => ["documents", userId],
  },

  LEAVE: {
    MY: ["leave", "my"],
    ALL: ["leave"],
  },

  ALERTS: {
    ALL: ["alerts"],
    EMPLOYEE: ["alerts", "employee"],
  },
} as const;