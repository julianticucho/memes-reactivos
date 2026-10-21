import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import productsService from "../services/products";
import ProductsExplorer from "../components/ProductsExplorer";

interface HomeProps {
  user: User | null;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Home = ({ user, setToast }: HomeProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService
      .getAll()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <ProductsExplorer
        products={products}
        user={user}
        setToast={setToast}
        onProductRemoved={(id) =>
          setProducts((prev) => prev.filter((p) => p._id !== id))
        }
      />
      <Outlet />
    </>
  );
};

export default Home;
