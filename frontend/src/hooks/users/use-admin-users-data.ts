"use client";

import { useCallback, useEffect, useState } from "react";

import { listAssignments } from "@/services/assignments.api";
import {
  getAllLeaveRequests,
  type LeaveRequestItem,
} from "@/services/leave.api";
import { listUsers } from "@/services/users.api";
import type { AssignmentItem } from "@/types/assignment.types";
import type { UserItem } from "@/types/user.types";

type AdminUsersData = {
  users: UserItem[];
  leaveRequests: LeaveRequestItem[];
  assignments: AssignmentItem[];
};

type UseAdminUsersDataResult = {
  data: AdminUsersData;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const initialData: AdminUsersData = {
  users: [],
  leaveRequests: [],
  assignments: [],
};

export function useAdminUsersData(): UseAdminUsersDataResult {
  const [data, setData] = useState<AdminUsersData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [usersRes, leaveRes, assignmentsRes] = await Promise.allSettled([
        listUsers(),
        getAllLeaveRequests(),
        listAssignments(),
      ]);

      const users =
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
          ? usersRes.value
          : [];

      const leaveRequests =
        leaveRes.status === "fulfilled" &&
        Array.isArray(leaveRes.value?.requests)
          ? leaveRes.value.requests
          : [];

      const assignments =
        assignmentsRes.status === "fulfilled"
          ? assignmentsRes.value.assignments ?? []
          : [];

      setData({
        users,
        leaveRequests,
        assignments,
      });

      if (
        usersRes.status === "rejected" &&
        leaveRes.status === "rejected" &&
        assignmentsRes.status === "rejected"
      ) {
        setError("Nu s-au putut încărca datele utilizatorilor.");
      }
    } catch {
      setData(initialData);
      setError("Nu s-au putut încărca datele utilizatorilor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}