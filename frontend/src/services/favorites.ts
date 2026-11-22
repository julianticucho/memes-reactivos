import axiosSecure from "../utils/axiosSecure";
import type { Product } from "../types/products";

export interface FavoriteResponse {
  favorited: boolean;
  favoriteCount: number;
}

// Favoritos del usuario autenticado (requieren sesión: el backend los
// rechaza para cualquier otro perfil). Vienen ordenados del más reciente
// al más antiguo según cuándo se marcaron.
const getFavorites = async () => {
  return axiosSecure
    .get<Product[]>("/api/users/me/favorites")
    .then((response) => response.data);
};

// Marca un producto como favorito. Idempotente en el backend (upsert con
// índice único): marcar dos veces no duplica el contador.
const addFavorite = async (productId: string) => {
  return axiosSecure
    .put<FavoriteResponse>(`/api/users/me/favorites/${productId}`)
    .then((response) => response.data);
};

// Desmarca un producto. También idempotente: si no estaba, no toca nada.
const removeFavorite = async (productId: string) => {
  return axiosSecure
    .delete<FavoriteResponse>(`/api/users/me/favorites/${productId}`)
    .then((response) => response.data);
};

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
};
