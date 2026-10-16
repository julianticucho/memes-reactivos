import { useEffect, useState } from "react";
import type { Product } from "../types/products";
import productsService from "../services/products";
import { Outlet } from "react-router-dom";
import ProductsFinder from "../components/ProductsFinder";

const Home = () => {
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
      <ProductsFinder products={products} />
      <Outlet />
    </>
  );
};

export default Home;
