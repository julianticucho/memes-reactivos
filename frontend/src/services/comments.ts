import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import type { Comment } from "../types/comments";

const getByProduct = async (productId: string) => {
  return axios
    .get<Comment[]>(`/api/products/${productId}/comments`)
    .then((response) => response.data);
};

const create = async (productId: string, text: string) => {
  return axiosSecure
    .post<Comment>(`/api/products/${productId}/comments`, { text })
    .then((response) => response.data);
};

const update = async (id: string, text: string) => {
  return axiosSecure
    .put<Comment>(`/api/comments/${id}`, { text })
    .then((response) => response.data);
};

const remove = async (id: string) => {
  await axiosSecure.delete(`/api/comments/${id}`);
};

export default {
  getByProduct,
  create,
  update,
  remove,
};
