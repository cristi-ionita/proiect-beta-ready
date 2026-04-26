"use client";

import { useCallback, useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import {
  approveUser,
  listPendingUsers,
  rejectUser,
} from "@/services/users.api";
import type { RegistrationRequestItem } from "@/types/user.types";

type UsePendingUsersResult = {
  users: RegistrationRequestItem[];
  loading: boolean;
  workingId: number | null;
  error: string;
  refetch: () => Promise<void>;
  approveAction: (userId: number) => Promise<void>;
  rejectAction: (userId: number) => Promise<void>;
};

export function usePendingUsers(): UsePendingUsersResult {
  const [users, setUsers] = useState<RegistrationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await listPendingUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setUsers([]);
      setError(
        isApiClientError(err)
          ? err.message
          : "Nu am putut încărca cererile de înregistrare."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approveAction = useCallback(
    async (userId: number) => {
      try {
        setWorkingId(userId);
        setError("");

        await approveUser(userId);
        await load();
      } catch (err: unknown) {
        setError(
          isApiClientError(err)
            ? err.message
            : "Nu am putut aproba utilizatorul."
        );
      } finally {
        setWorkingId(null);
      }
    },
    [load]
  );

  const rejectAction = useCallback(
    async (userId: number) => {
      try {
        setWorkingId(userId);
        setError("");

        await rejectUser(userId);
        await load();
      } catch (err: unknown) {
        setError(
          isApiClientError(err)
            ? err.message
            : "Nu am putut respinge utilizatorul."
        );
      } finally {
        setWorkingId(null);
      }
    },
    [load]
  );

  return {
    users,
    loading,
    workingId,
    error,
    refetch: load,
    approveAction,
    rejectAction,
  };
}