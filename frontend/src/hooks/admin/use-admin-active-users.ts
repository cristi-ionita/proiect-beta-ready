"use client";

import { useCallback, useEffect, useState } from "react";

import { listAssignments } from "@/services/assignments.api";
import {
  getAllLeaveRequests,
  type LeaveRequestItem,
} from "@/services/leave.api";
import { listUsers } from "@/services/users.api";
import { isApiClientError } from "@/lib/api-error";
import type { AssignmentItem } from "@/types/assignment.types";
import type { UserItem } from "@/types/user.types";

type UseAdminActiveUsersParams = {
  errorMessage: string;
};

type UseAdminActiveUsersResult = {
  users: UserItem[];
  leaveRequests: LeaveRequestItem[];
  assignments: AssignmentItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useAdminActiveUsers({
  errorMessage,
}: UseAdminActiveUsersParams): UseAdminActiveUsersResult {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [usersResult, leaveResult, assignmentsResult] =
        await Promise.allSettled([
          listUsers(),
          getAllLeaveRequests(),
          listAssignments(),
        ]);

      if (usersResult.status === "fulfilled") {
        setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
      } else {
        setUsers([]);
      }

      if (leaveResult.status === "fulfilled") {
        setLeaveRequests(
          Array.isArray(leaveResult.value?.requests)
            ? leaveResult.value.requests
            : []
        );
      } else {
        setLeaveRequests([]);
      }

      if (assignmentsResult.status === "fulfilled") {
        setAssignments(
          Array.isArray(assignmentsResult.value?.assignments)
            ? assignmentsResult.value.assignments
            : []
        );
      } else {
        setAssignments([]);
      }

      if (
        usersResult.status === "rejected" &&
        leaveResult.status === "rejected" &&
        assignmentsResult.status === "rejected"
      ) {
        const firstError = usersResult.reason;
        setError(isApiClientError(firstError) ? firstError.message : errorMessage);
      }
    } catch (err: unknown) {
      setUsers([]);
      setLeaveRequests([]);
      setAssignments([]);
      setError(isApiClientError(err) ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    users,
    leaveRequests,
    assignments,
    loading,
    error,
    refetch: load,
  };
}