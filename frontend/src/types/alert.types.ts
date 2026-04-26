export interface UserAlert {
  id: number;
  full_name: string;
  unique_code?: string | null;
}

export interface VehicleIssueAlert {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  issues_count: number;
}

export interface OccupiedVehicle {
  assignment_id: number;
  vehicle_display_name: string;
  user_full_name: string;
  started_at: string;
}

export interface UsersResponse {
  users: UserAlert[];
}

export interface VehiclesWithIssuesResponse {
  vehicles: VehicleIssueAlert[];
}

export interface OccupiedVehiclesResponse {
  vehicles: OccupiedVehicle[];
}