import { useEffect, useState } from "react";
import favoritesService from "../services/favorites";
import useAuthStore from "../store/authStore";
import useUiStore from "../store/uiStore";

interface FavoriteButtonProps {
  productId: string;
  /** Contador inicial, tomado del producto ya cargado. */
  initialCount?: number;
}

// Widget de favoritos: etiqueta con estrella + contador al lado del botón
// "Favorito". Encapsula todo el estado (marcado, contador, busy) para que
// cualquier vista que lo monte tenga el mismo comportamiento.
const FavoriteButton = ({
  productId,
  initialCount = 0,
}: FavoriteButtonProps) => {
  const user = useAuthStore((state) => state.user);
  const notify = useUiStore((state) => state.notify);
  const [favorited, setFavorited] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFavorited(false);
    setCount(initialCount);
    if (!user) return;
    let cancelled = false;
    // El backend no expone "favoritedByMe": se consulta la lista de
    // favoritos del usuario (endpoint barato) y se comprueba por _id.
    favoritesService
      .getFavorites()
      .then((favorites) => {
        if (!cancelled) {
          setFavorited(favorites.some((f) => f._id === productId));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId, initialCount, user]);

  // Toggle optimista: la UI se actualiza al instante y se revierte si el
  // backend rechaza la operacion (sesion expirada, producto retirado...).
  const toggleFavorite = () => {
    if (busy) return;
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);
    setCount((c) => Math.max(0, c + (nextFavorited ? 1 : -1)));
    setBusy(true);
    const call = nextFavorited
      ? favoritesService.addFavorite(productId)
      : favoritesService.removeFavorite(productId);
    call
      .then((result) => {
        // Se acepta el contador del backend por si otro usuario movio el
        // suyo mientras tanto.
        setCount(result.favoriteCount);
        setFavorited(result.favorited);
      })
      .catch((err) => {
        setFavorited(!nextFavorited);
        setCount(initialCount);
        const msg =
          err?.response?.data?.error ||
          "Error al actualizar favoritos (¿sesión expirada?)";
        notify(msg, "error");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className={`detail-favorite${favorited ? " is-favorited" : ""}`}>
      <p className="favorite-count" title="Favoritos">
        <span className="favorite-star" aria-hidden="true">
          ★
        </span>
        {count}
      </p>
      <button
        type="button"
        className="favorite-button"
        disabled={!user || busy}
        aria-pressed={favorited}
        title={
          user
            ? favorited
              ? "Quitar de favoritos"
              : "Agregar a favoritos"
            : "Inicia sesión para marcar favoritos"
        }
        onClick={toggleFavorite}
      >
        Favorito
      </button>
    </div>
  );
};

export default FavoriteButton;
