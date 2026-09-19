import axios from "axios";
import type { Product } from "../types/products";


const getAll = async () => {
  return axios.get<Product[]>("/api/products").then((response) => response.data);
};

interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  image?: string | null;
  seller: string;
  category: string;
}

const create = async (data: ProductCreateData) => {
  return axios
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
