import { api } from "@/lib/axios";
import type { RegistrationRequestItem, UserItem } from "@/types/user.types";

type ListUsersParams = {
  active_only?: boolean;
  role?: string;
  status?: string;
};

export async function listUsers(params?: ListUsersParams): Promise<UserItem[]> {
  const { data } = await api.get<UserItem[]>("/users", {
    params,
  });

  return Array.isArray(data) ? data : [];
}

export async function listPendingUsers(): Promise<RegistrationRequestItem[]> {
  const { data } = await api.get<RegistrationRequestItem[]>("/users/pending");
  return Array.isArray(data) ? data : [];
}

export async function getUser(userId: number): Promise<UserItem> {
  const { data } = await api.get<UserItem>(`/users/${userId}`);
  return data;
}

export async function activateUser(userId: number): Promise<UserItem> {
  const { data } = await api.patch<UserItem>(`/users/${userId}/activate`);
  return data;
}

export async function deactivateUser(userId: number): Promise<UserItem> {
  const { data } = await api.patch<UserItem>(`/users/${userId}/deactivate`);
  return data;
}

export async function approveUser(userId: number): Promise<UserItem> {
  const { data } = await api.patch<UserItem>(`/users/${userId}/approve`);
  return data;
}

export async function rejectUser(userId: number): Promise<void> {
  await api.patch(`/users/${userId}/reject`);
}

export async function suspendUser(userId: number): Promise<UserItem> {
  const { data } = await api.patch<UserItem>(`/users/${userId}/suspend`);
  return data;
}

export async function updateUserShift(
  userId: number,
  shift: number
): Promise<UserItem> {
  const { data } = await api.patch<UserItem>(
    `/users/${userId}/shift`,
    null,
    {
      params: { shift },
    }
  );

  return data;
}