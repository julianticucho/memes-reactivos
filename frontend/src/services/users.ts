import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import type { User } from "../types/users";

const getProfile = async (id: string) => {
  return axios.get<User>(`/api/users/${id}`).then((response) => response.data);
};

// Actualiza la foto de perfil (data URL o null). No exige contraseña.
const updateAvatar = async (avatar: string | null) => {
  return axiosSecure
    .put<User>("/api/users/me/avatar", { avatar })
    .then((response) => response.data);
};

// Cambia email y/o contraseña. Ambos exigen la contraseña actual.
export interface ProfileUpdate {
  email?: string;
  currentPassword: string;
  newPassword?: string;
}

const updateProfile = async (data: ProfileUpdate) => {
  return axiosSecure
    .put<User>("/api/users/me", data)
    .then((response) => response.data);
};

export default {
  getProfile,
  updateAvatar,
  updateProfile,
};
