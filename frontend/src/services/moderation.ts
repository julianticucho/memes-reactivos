import axiosSecure from "../utils/axiosSecure";
import type { Product } from "../types/products";

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

export default { getPending, approve };
