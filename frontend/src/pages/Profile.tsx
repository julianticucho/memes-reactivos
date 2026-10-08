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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <img
          src="/no-avatar.png"
          alt={user.username}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div>
          <h1 style={{ margin: 0 }}>{user.username}</h1>
          <p style={{ margin: "4px 0 0", color: "#666" }}>{user.email}</p>
        </div>
      </div>
      <h2>Mis productos</h2>
      <ProductsFinder products={products} />
    </>
  );
};

export default Profile;
