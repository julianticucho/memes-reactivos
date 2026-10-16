import axios from "axios";
import type { User } from "../types/users";

const getProfile = async (id: string) => {
  return axios.get<User>(`/api/users/${id}`).then((response) => response.data);
};

export default {
  getProfile,
};
