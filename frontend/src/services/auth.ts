import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import type { User } from "../types/users";

interface Credentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const login = async (credentials: Credentials) => {
  const response = await axios.post("/api/login", credentials);
  const csrfToken = response.headers["x-csrf-token"];
  if (typeof csrfToken === "string") {
    localStorage.setItem("csrfToken", csrfToken);
  }
  return response.data as { username: string };
};

const register = async (data: RegisterData) => {
  const response = await axios.post<User>("/api/users", data);
  return response.data;
};

const restoreLogin = async () => {
  try {
    const response = await axiosSecure.get<User>("/api/login/me");
    return response.data;
  } catch {
    return null;
  }
};

const logout = async () => {
  await axiosSecure.post("/api/login/logout");
  localStorage.removeItem("csrfToken");
};

export default { login, register, restoreLogin, logout };
