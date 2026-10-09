import { useEffect, useState } from "react";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import productsService from "../services/products";
import ProductsFinder from "../components/ProductsFinder";

interface ProfileProps {
  user: User;
}

const Profile = ({ user }: ProfileProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService
      .getAll()
      .then((data) =>
        setProducts(data.filter((p) => p.seller === user.username)),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.username]);

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <div className="profile-header">
        <img src="/no-avatar.png" alt={user.username} />
        <div>
          <h1>{user.username}</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <h2>Mis productos</h2>
      <ProductsFinder products={products} />
    </>
  );
};

export default Profile;
