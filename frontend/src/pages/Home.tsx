import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import type { Product } from "../types/products";
import productsService from "../services/products";
import ProductsExplorer from "../components/ProductsExplorer";

interface HomeProps {
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Home = ({ setToast }: HomeProps) => {
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
