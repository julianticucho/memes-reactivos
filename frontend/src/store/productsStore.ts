import { create } from "zustand";
import type { Product } from "../types/products";
import productsService from "../services/products";

type ProductsState = {
  products: Product[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
};

const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const products = await productsService.getAll();
      set({ products });
    } finally {
      set({ loading: false });
    }
  },

  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),

  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) =>
        p._id === product._id ? product : p,
      ),
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p._id !== id),
    })),
}));

export default useProductsStore;
