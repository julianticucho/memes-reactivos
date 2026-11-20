import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import ProductsExplorer from "../components/ProductsExplorer";
import useProductsStore from "../store/productsStore";

interface HomeProps {
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Home = ({ setToast }: HomeProps) => {
  const products = useProductsStore((state) => state.products);
  const loading = useProductsStore((state) => state.loading);
  const fetchAll = useProductsStore((state) => state.fetchAll);

  useEffect(() => {
    if (products.length === 0) void fetchAll();
  }, [products.length, fetchAll]);

  if (loading && products.length === 0) return <p>Cargando...</p>;

  return (
    <>
      <ProductsExplorer products={products} setToast={setToast} />
      <Outlet />
    </>
  );
};

export default Home;
