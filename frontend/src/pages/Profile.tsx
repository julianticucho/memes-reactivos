import { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import type { ReviewsResponse } from "../types/reviews";
import productsService from "../services/products";
import usersService from "../services/users";
import reviewsService from "../services/reviews";
import ProductsExplorer from "../components/ProductsExplorer";
import Tabs from "../components/Tabs";
import ReviewSection from "../components/ReviewSection";
import EditProfile from "./EditProfile";
import useAuthStore from "../store/authStore";

const EMPTY_STATS = { upvotes: 0, downvotes: 0, score: 0, count: 0 };

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  // Editar perfil es un modal sobre el perfil, igual que el detalle de
  // producto: el estado vive en la URL (?edit=...), no en una ruta.
  const editOpen = params.has("edit");

  const openEdit = () => {
    const next = new URLSearchParams(params);
    next.set("edit", "perfil");
    setParams(next);
  };

  const closeEdit = () => {
    const next = new URLSearchParams(params);
    next.delete("edit");
    setParams(next, { replace: true });
  };
  const profileId = id ?? user?.id ?? null;
  const [profile, setProfile] = useState<User | null>(id ? null : user);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const editOpenRef = useRef(false);

  useEffect(() => {
    if (editOpen) {
      // Abrir el modal no recarga nada: recargar aqui hace parpadear el
      // fondo (página entera → "Cargando..." → repaint).
      editOpenRef.current = true;
      return;
    }
    const closedAfterEditing = editOpenRef.current;
    editOpenRef.current = false;

    if (!profileId) return;

    // Cierre del modal: refresco silencioso de SOLO el perfil, para que
    // el email/avatar editados se vean al instante (sin "Cargando..." ni
    // reset del tab activo). Los productos y reseñas no cambian al editar
    // el perfil.
    if (closedAfterEditing) {
      let cancelled = false;
      usersService
        .getProfile(profileId)
        .then((profileData) => {
          if (!cancelled) setProfile(profileData);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    Promise.all([
      usersService.getProfile(profileId),
      reviewsService.getByUser(profileId),
    ])
      .then(([profileData, reviews]) => {
        setProfile(profileData);
        setReviewsData(reviews);
        setActiveTab("products");
        const loadProducts =
          profileData.id === user?.id
            ? productsService.getMine()
            : productsService
                .getAll()
                .then((all) =>
                  all.filter((p) => p.seller === profileData.username),
                );
        return loadProducts.then(setProducts);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [profileId, editOpen]);

  const reloadReviews = () => {
    if (!profileId) return;
    reviewsService
      .getByUser(profileId)
      .then(setReviewsData)
      .catch(() => {});
  };

  if (loading) return <p>Cargando...</p>;
  if (!profile || !reviewsData) return <p>Usuario no encontrado</p>;

  const stats = reviewsData.stats ?? EMPTY_STATS;
  const scoreLabel = () => {
    if (stats.count === 0) return <span>Sin reseñas</span>;

    if (stats.score === 0) return <span>0</span>;
    else if (stats.score > 0) return <span>+{stats.score}</span>;
    else return <span>{stats.score}</span>;
  };

  const reviewsTab = (
    <ReviewSection
      profileId={profile.id}
      data={reviewsData}
      onChanged={reloadReviews}
    />
  );

  const productsTab = (
    <ProductsExplorer
      products={products}
      onProductRemoved={(id) =>
        setProducts((prev) => prev.filter((p) => p._id !== id))
      }
    />
  );

  return (
    <div className="profile-page">
      <div
        className="profile-header"
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <img src={profile.avatar ?? "/no-avatar.png"} alt={profile.username} />
        <div>
          <h1>{profile.username}</h1>
          {user?.id === profile.id && <p>Este es tu perfil</p>}
        </div>
        {user?.id === profile.id && (
          <button
            type="button"
            onClick={openEdit}
            style={{ marginLeft: "auto" }}
          >
            Editar perfil
          </button>
        )}
      </div>
      <ul className="tree-view profile-info">
        <li>
          <span className="info-label">Contacto: </span>
          {profile.email}
        </li>
        <li>
          <span className="info-label">Reputación: </span>
          {scoreLabel()}
        </li>
      </ul>
      <Tabs
        ariaLabel="Secciones del perfil"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            key: "products",
            label: `Productos (${products.length})`,
            content: productsTab,
          },
          {
            key: "reviews",
            label: `Reseñas (${stats.count})`,
            content: reviewsTab,
          },
        ]}
      />

      {editOpen && user && profile.id === user.id && (
        <EditProfile onClose={closeEdit} />
      )}
    </div>
  );
};

export default Profile;
