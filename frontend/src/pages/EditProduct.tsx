import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import productsService from "../services/products";
import NewProduct from "./NewProduct";

interface EditProductProps {
  user: User;
  setToast: (toast: {
    message: string;
    severity: "success" | "error";
  }) => void;
}

const EditProduct = ({ user, setToast }: EditProductProps) => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productsService
      .getById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!product) return <p>Producto no encontrado</p>;
  if (product.user !== user.id) return <p>No autorizado</p>;

  return <NewProduct product={product} setToast={setToast} />;
};

export default EditProduct;
