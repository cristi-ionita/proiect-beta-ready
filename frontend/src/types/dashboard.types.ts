export interface AdminDashboardRecentIssue {
  id: number;
  status: string;
  priority: string;
  created_at: string;
  vehicle_license_plate: string;
  reported_by: string;
  problem: string | null;
}

export interface AdminDashboardActiveAssignment {
  id: number;
  started_at: string;
  vehicle_license_plate: string;
  vehicle_display_name: string;
  user_full_name: string;
}

export interface AdminDashboardIssuesSummary {
  total: number;
  open: number;
  scheduled: number;
  in_progress: number;
  resolved: number;
  canceled: number;
}

export interface AdminDashboardSummaryResponse {
  users: {
    total: number;
    active: number;
    working_today: number;
    on_leave_today: number;
    inactive: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
  vehicles: {
    total: number;
    available: number;
    assigned: number;
    in_service: number;
    out_of_service: number;
  };
  assignments: {
    active: number;
    closed: number;
  };
  issues: AdminDashboardIssuesSummary;
  documents: {
    total: number;
    personal: number;
    company: number;
    contracts: number;
    payslips: number;
    driver_licenses: number;
  };
  recent_issues: AdminDashboardRecentIssue[];
  active_assignments: AdminDashboardActiveAssignment[];
}

export interface AdminDashboardData {
  workingTodayUsers: number;
  todayLeaves: number;
  availableVehicles: number;
  pendingUsers: number;
  issuesSummary: AdminDashboardIssuesSummary;
  issues: AdminDashboardRecentIssue[];
  activeAssignments: AdminDashboardActiveAssignment[];
}