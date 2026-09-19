import axios from "axios";
import type { Product } from "../types/products";

const productsUrl = "/api/products";

const getAll = async () => {
  return axios.get<Product[]>(productsUrl).then((response) => response.data);
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
    .post<Product>(productsUrl, data)
    .then((response) => response.data);
};

const productUrl = "/product/id";

const getById = async (id: string) => {
  return axios
    .get<Product>(`${productUrl}/${id}`)
    .then((response) => response.data);
};

export default {
  getAll,
  create,
  getById,
};
