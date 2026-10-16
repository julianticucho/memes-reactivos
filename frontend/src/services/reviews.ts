import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import type { Review, ReviewData, ReviewsResponse } from "../types/reviews";

const getByUser = async (userId: string) => {
  return axios
    .get<ReviewsResponse>(`/api/users/${userId}/reviews`)
    .then((response) => response.data);
};

const create = async (userId: string, data: ReviewData) => {
  return axiosSecure
    .post<Review>(`/api/users/${userId}/reviews`, data)
    .then((response) => response.data);
};

const update = async (userId: string, data: ReviewData) => {
  return axiosSecure
    .put<Review>(`/api/users/${userId}/reviews`, data)
    .then((response) => response.data);
};

const remove = async (userId: string) => {
  await axiosSecure.delete(`/api/users/${userId}/reviews`);
};

export default {
  getByUser,
  create,
  update,
  remove,
};
