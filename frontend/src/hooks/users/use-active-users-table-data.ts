"use client";

import { useMemo } from "react";

import type { AssignmentItem } from "@/types/assignment.types";
import type { UserItem } from "@/types/user.types";
import type { LeaveRequestItem } from "@/services/leave.api";

export type ActiveUserRowData = {
  id: number;
  full_name: string;
  unique_code: string;
  role: string;
  is_active: boolean;
  shift_number: string | null;
  vehicle_license_plate: string | null;
};

function getAssignmentUserId(item: AssignmentItem): number | null {
  const record = item as AssignmentItem & {
    user_id?: number;
    assigned_to_user_id?: number;
    employee_id?: number;
  };

  if (typeof record.user_id === "number") return record.user_id;
  if (typeof record.assigned_to_user_id === "number") return record.assigned_to_user_id;
  if (typeof record.employee_id === "number") return record.employee_id;

  return null;
}

function getAssignmentPlate(item: AssignmentItem): string | null {
  const record = item as AssignmentItem & {
    vehicle_license_plate?: string | null;
    license_plate?: string | null;
  };

  return record.vehicle_license_plate ?? record.license_plate ?? null;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isAssignmentActive(item: AssignmentItem): boolean {
  const record = item as AssignmentItem & {
    status?: string | null;
  };

  return normalize(record.status) === "active";
}

function getAssignmentStartedAt(item: AssignmentItem): number {
  const record = item as AssignmentItem & {
    started_at?: string | null;
  };

  if (!record.started_at) return 0;

  const timestamp = new Date(record.started_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getUserShift(user: UserItem): string | null {
  const record = user as UserItem & {
    shift_number?: string | number | null;
    shift?: string | number | null;
  };

  const rawValue = record.shift_number ?? record.shift ?? null;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  return String(rawValue);
}

export function useActiveUsersTableData(
  users: UserItem[],
  leaveRequests: LeaveRequestItem[],
  assignments: AssignmentItem[]
): ActiveUserRowData[] {
  return useMemo(() => {
    const activeAssignmentsByUser = new Map<number, AssignmentItem>();

    for (const assignment of assignments) {
      if (!isAssignmentActive(assignment)) {
        continue;
      }

      const userId = getAssignmentUserId(assignment);

      if (userId === null) {
        continue;
      }

      const existingAssignment = activeAssignmentsByUser.get(userId);

      if (!existingAssignment) {
        activeAssignmentsByUser.set(userId, assignment);
        continue;
      }

      const existingStartedAt = getAssignmentStartedAt(existingAssignment);
      const currentStartedAt = getAssignmentStartedAt(assignment);

      if (currentStartedAt >= existingStartedAt) {
        activeAssignmentsByUser.set(userId, assignment);
      }
    }

    return users
      .filter((user) => normalize(user.role) === "employee")
      .filter((user) => user.is_active)
      .map((user) => {
        const activeAssignment = activeAssignmentsByUser.get(user.id);

        return {
          id: user.id,
          full_name: user.full_name,
          unique_code: user.unique_code ?? "",
          role: user.role,
          is_active: user.is_active,
          shift_number: getUserShift(user),
          vehicle_license_plate: activeAssignment
            ? getAssignmentPlate(activeAssignment)
            : null,
        };
      });
  }, [users, leaveRequests, assignments]);
}