import api from "../../Api/Api";
import type { LoginCredentials, LoginResponse } from "../../types/types.ts";

export const loginApi = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  const { data } = await api.post<LoginResponse>("/users/login", formData);
  return data;
};

export const getMeApi = async () => {
  const { data } = await api.get("/users/me");
  return data;
};
