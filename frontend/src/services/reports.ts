import axiosSecure from "../utils/axiosSecure";
import type { ReportData } from "../types/reports";

const reportProduct = async (id: string, data: ReportData) => {
  return axiosSecure
    .post(`/api/products/${id}/report`, data)
    .then((response) => response.data);
};

const reportComment = async (id: string, data: ReportData) => {
  return axiosSecure
    .post(`/api/comments/${id}/report`, data)
    .then((response) => response.data);
};

const reportReview = async (
  userId: string,
  reviewId: string,
  data: ReportData,
) => {
  return axiosSecure
    .post(`/api/users/${userId}/reviews/${reviewId}/report`, data)
    .then((response) => response.data);
};

export default { reportProduct, reportComment, reportReview };
