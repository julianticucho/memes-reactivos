import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import type { ReviewsResponse } from "../types/reviews";
import productsService from "../services/products";
import usersService from "../services/users";
import reviewsService from "../services/reviews";
import ProductsFinder from "../components/ProductsFinder";
import Tabs from "../components/Tabs";
import ReviewSection from "../components/ReviewSection";

interface ProfileProps {
  user: User | null;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const EMPTY_STATS = { upvotes: 0, downvotes: 0, score: 0, count: 0 };

const Profile = ({ user, setToast }: ProfileProps) => {
  const { id } = useParams<{ id: string }>();
  const profileId = id ?? user?.id ?? null;
  const [profile, setProfile] = useState<User | null>(id ? null : user);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("productos");

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    Promise.all([
      usersService.getProfile(profileId),
      reviewsService.getByUser(profileId),
    ])
      .then(([profileData, reviews]) => {
        setProfile(profileData);
        setReviewsData(reviews);
        setActiveTab("productos");
        return productsService
          .getAll()
          .then((all) =>
            setProducts(all.filter((p) => p.seller === profileData.username)),
          );
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [profileId]);

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
      user={user}
      data={reviewsData}
      onChanged={reloadReviews}
      setToast={setToast}
    />
  );

  const productsTab = <ProductsFinder products={products} />;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src="/no-avatar.png" alt={profile.username} />
        <div>
          <h1>{profile.username}</h1>
          {user?.id === profile.id && <p>Este es tu perfil</p>}
        </div>
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
            key: "productos",
            label: `Productos (${products.length})`,
            content: productsTab,
          },
          {
            key: "resenas",
            label: `Reseñas (${stats.count})`,
            content: reviewsTab,
          },
        ]}
      />
    </div>
  );
};

export default Profile;
