import { useEffect, useState } from "react";
import type { Product } from "../types/products";
import productsService from "../services/products";
import ProductsFinder from "../components/ProductsFinder";

const USER = {
  name: "Usuario Ejemplo",
  avatar: null as string | null,
};

const Profile = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService
      .getAll()
      .then((data) => setProducts(data.filter((p) => p.seller === USER.name)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          src={USER.avatar || "/no-avatar.png"}
          alt={USER.name}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <h1 style={{ margin: 0 }}>{USER.name}</h1>
      </div>
      <h2>Mis productos</h2>
      <ProductsFinder products={products} />
    </>
  );
};

export default Profile;
