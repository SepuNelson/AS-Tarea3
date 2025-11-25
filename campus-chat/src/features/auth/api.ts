import { apiClient } from "@/lib/apiClient";
import type { UserProfile } from "@/types";

export interface LoginPayload {
  username_or_email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UpdateProfilePayload {
  full_name?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const login = async (payload: LoginPayload) => {
  const { data } = await apiClient.post<TokenResponse>("/v1/auth/login", payload);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post<UserProfile>("/v1/users/register", payload);
  return data;
};

export const fetchProfile = async () => {
  const { data } = await apiClient.get<UserProfile>("/v1/users/me");
  return data;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const { data } = await apiClient.patch<UserProfile>("/v1/users/me", payload);
  return data;
};




