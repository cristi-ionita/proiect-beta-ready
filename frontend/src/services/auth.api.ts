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

type GenericMessageResponse = {
  message: string;
};

type ResendVerificationResponse = {
  success: boolean;
  message: string;
};

// ---------------- LOGIN ----------------

export async function userLogin(
  payload: UserLoginRequest
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

// ---------------- REGISTER ----------------

export async function register(
  payload: RegisterRequest
): Promise<void> {
  await api.post("/auth/register", payload);
}

// ---------------- ME ----------------

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

// ---------------- FORGOT PASSWORD ----------------

export async function forgotPassword(
  email: string
): Promise<GenericMessageResponse> {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

// ---------------- RESET PASSWORD ----------------

export async function resetPassword(
  token: string,
  password: string
): Promise<GenericMessageResponse> {
  const { data } = await api.post("/auth/reset-password", {
    token,
    password,
  });
  return data;
}

// ---------------- RESEND VERIFICATION EMAIL ----------------

export async function resendVerificationEmail(
  email: string
): Promise<ResendVerificationResponse> {
  const { data } = await api.post<ResendVerificationResponse>(
    "/auth/resend-verification-email",
    { email }
  );

  return data;
}