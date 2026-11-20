import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Product } from "../types/products";
import productsService from "../services/products";
import NewProduct from "./NewProduct";
import ModalWindow from "../components/ModalWindow";
import useAuthStore from "../store/authStore";

interface EditProductProps {
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const EditProduct = ({ setToast }: EditProductProps) => {
  const user = useAuthStore((state) => state.user);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Los estados de carga/error van dentro de la misma ventana de diálogo
  // que el formulario, igual que en ProductDetail.
  if (loading || !product || product.user !== user?.id) {
    return (
      <ModalWindow
        title="Editar producto"
        className="detail-window"
        onClose={() => navigate("/")}
      >
        <p>
          {loading
            ? "Cargando..."
            : !product
              ? "Producto no encontrado"
              : "No autorizado"}
        </p>
      </ModalWindow>
    );
  }

  return <NewProduct product={product} setToast={setToast} />;
};

export default EditProduct;
