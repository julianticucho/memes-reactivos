import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import type { Product } from "../types/products";

const getAll = async () => {
  return axios.get<Product[]>("/api/products").then((response) => response.data);
};

interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  image?: string[] | null;
  category: string;
}

const create = async (data: ProductCreateData) => {
  return axiosSecure
    .post<Product>("/api/products", data)
    .then((response) => response.data);
};

const getById = async (id: string) => {
  return axios
    .get<Product>(`/api/products/${id}`)
    .then((response) => response.data);
};

export default {
  getAll,
  create,
  getById,
};
