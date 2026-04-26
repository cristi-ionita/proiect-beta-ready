"use client";

import { useCallback, useEffect, useState } from "react";

import {
  closeAssignment,
  createAssignment,
  deleteAssignment,
  listAssignments,
} from "@/services/assignments.api";
import { listUsers } from "@/services/users.api";
import { listVehicles } from "@/services/vehicles.api";
import { isApiClientError } from "@/lib/api-error";
import type { AssignmentItem } from "@/types/assignment.types";
import type { UserItem } from "@/types/user.types";
import type { VehicleItem } from "@/types/vehicle.types";

type UseAdminAssignmentsParams = {
  errorMessage: string;
};

type UseAdminAssignmentsResult = {
  assignments: AssignmentItem[];
  users: UserItem[];
  vehicles: VehicleItem[];
  loading: boolean;
  saving: boolean;
  workingId: number | null;
  error: string;
  refetch: () => Promise<void>;
  createAssignmentAction: (
    userId: number,
    vehicleId: number,
    shiftNumber: number
  ) => Promise<void>;
  closeAssignmentAction: (assignmentId: number) => Promise<void>;
  deleteAssignmentAction: (assignmentId: number) => Promise<void>;
};

function isOpenAssignment(assignment: AssignmentItem) {
  return assignment.status === "pending" || assignment.status === "active";
}

export function useAdminAssignments({
  errorMessage,
}: UseAdminAssignmentsParams): UseAdminAssignmentsResult {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentsRes, usersRes, vehiclesRes] = await Promise.allSettled([
        listAssignments(),
        listUsers({}),
        listVehicles(),
      ]);

      const safeAssignments =
        assignmentsRes.status === "fulfilled" &&
        Array.isArray(assignmentsRes.value?.assignments)
          ? assignmentsRes.value.assignments
          : [];

      const safeUsers =
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
          ? usersRes.value
          : [];

      const safeVehicles =
        vehiclesRes.status === "fulfilled" && Array.isArray(vehiclesRes.value)
          ? vehiclesRes.value
          : [];

      const openAssignments = safeAssignments.filter(isOpenAssignment);

      const assignedUserIds = new Set(
        openAssignments.map((assignment) => assignment.user_id)
      );

      const assignedVehicleIds = new Set(
        openAssignments.map((assignment) => assignment.vehicle_id)
      );

      setAssignments(safeAssignments);

      setUsers(
        safeUsers.filter(
          (user) =>
            user.is_active &&
            user.role === "employee" &&
            user.status === "approved" &&
            !assignedUserIds.has(user.id)
        )
      );

      setVehicles(
        safeVehicles.filter(
          (vehicle) =>
            vehicle.status === "available" &&
            !assignedVehicleIds.has(vehicle.id)
        )
      );

      if (
        assignmentsRes.status === "rejected" &&
        usersRes.status === "rejected" &&
        vehiclesRes.status === "rejected"
      ) {
        setError(errorMessage);
      }
    } catch (err: unknown) {
      setAssignments([]);
      setUsers([]);
      setVehicles([]);
      setError(isApiClientError(err) ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAssignmentAction = useCallback(
    async (userId: number, vehicleId: number) => {
      try {
        setSaving(true);
        setError("");

        await createAssignment({
          user_id: userId,
          vehicle_id: vehicleId,
        });

        await load();
      } catch (err: unknown) {
        const message = isApiClientError(err)
          ? err.message
          : "Failed to create assignment.";

        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const closeAssignmentAction = useCallback(
    async (assignmentId: number) => {
      try {
        setWorkingId(assignmentId);
        setError("");

        await closeAssignment(assignmentId);
        await load();
      } catch (err: unknown) {
        setError(
          isApiClientError(err)
            ? err.message
            : "Failed to close assignment."
        );
      } finally {
        setWorkingId(null);
      }
    },
    [load]
  );

  const deleteAssignmentAction = useCallback(
    async (assignmentId: number) => {
      try {
        setWorkingId(assignmentId);
        setError("");

        await deleteAssignment(assignmentId);
        await load();
      } catch (err: unknown) {
        setError(
          isApiClientError(err)
            ? err.message
            : "Failed to delete assignment."
        );
      } finally {
        setWorkingId(null);
      }
    },
    [load]
  );

  return {
    assignments,
    users,
    vehicles,
    loading,
    saving,
    workingId,
    error,
    refetch: load,
    createAssignmentAction,
    closeAssignmentAction,
    deleteAssignmentAction,
  };
}