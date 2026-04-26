import { api } from "@/lib/axios";
import type {
  AuthResponse,
  RegisterRequest,
  UserLoginRequest,
} from "@/types/auth.types";

type MeResponse = {
  user_id: number;
  role: string;
  username: string;
};

export async function userLogin(
  payload: UserLoginRequest
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(
  payload: RegisterRequest
): Promise<void> {
  await api.post("/auth/register", payload);
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}