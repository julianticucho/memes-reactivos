import axiosSecure from "../utils/axiosSecure";
import type { Product } from "../types/products";
import type { Comment, ModerationComment } from "../types/comments";
import type { ModerationReview, Review } from "../types/reviews";
import type { ModerationReportGroup, ReportTargetType } from "../types/reports";

const getPending = async () => {
  return axiosSecure
    .get<Product[]>("/api/moderation/products")
    .then((response) => response.data);
};

const approve = async (id: string) => {
  return axiosSecure
    .post<Product>(`/api/moderation/products/${id}/approve`)
    .then((response) => response.data);
};

const getPendingComments = async () => {
  return axiosSecure
    .get<ModerationComment[]>("/api/moderation/comments")
    .then((response) => response.data);
};

const approveComment = async (id: string) => {
  return axiosSecure
    .post<Comment>(`/api/moderation/comments/${id}/approve`)
    .then((response) => response.data);
};

const removeComment = async (id: string) => {
  await axiosSecure.delete(`/api/moderation/comments/${id}`);
};

const getPendingReviews = async () => {
  return axiosSecure
    .get<ModerationReview[]>("/api/moderation/reviews")
    .then((response) => response.data);
};

const approveReview = async (id: string) => {
  return axiosSecure
    .post<Review>(`/api/moderation/reviews/${id}/approve`)
    .then((response) => response.data);
};

const removeReview = async (id: string) => {
  await axiosSecure.delete(`/api/moderation/reviews/${id}`);
};

const getReports = async () => {
  return axiosSecure
    .get<ModerationReportGroup[]>("/api/moderation/reports")
    .then((response) => response.data);
};

const dismissReports = async (targetType: ReportTargetType, id: string) => {
  await axiosSecure.post(`/api/moderation/reports/${targetType}/${id}/dismiss`);
};

export default {
  getReports,
  dismissReports,
  getPending,
  approve,
  getPendingComments,
  approveComment,
  removeComment,
  getPendingReviews,
  approveReview,
  removeReview,
};
