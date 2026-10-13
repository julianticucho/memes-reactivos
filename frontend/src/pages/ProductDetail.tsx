import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import productsService from "../services/products";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ProductDetailProps {
  user: User | null;
  setToast: (toast: {
    message: string;
    severity: "success" | "error";
  }) => void;
}

const ProductDetail = ({ user, setToast }: ProductDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    productsService
      .getById(id)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!product) return;
    setConfirming(false);
    productsService
      .remove(product._id)
      .then(() => {
        setToast({ message: "Producto eliminado", severity: "success" });
        navigate("/");
      })
      .catch((err) => {
        const msg
          = err?.response?.data?.error || "Error al eliminar (¿sesión expirada?)";
        setToast({ message: msg, severity: "error" });
      });
  };

  if (loading) return <p>Cargando...</p>;
  if (!product) return <p>Producto no encontrado</p>;

  const isOwner = !!user && product.user === user.id;

  return (
    <>
      <h1>{product.name}</h1>
      {product.image && product.image.length > 0 && (
        <div className="detail-images">
          {product.image.map((img, idx) => (
            <img key={idx} src={img} alt={`${product.name} ${idx + 1}`} />
          ))}
        </div>
      )}
      <fieldset>
        <legend>Detalles</legend>
        <p>{product.description}</p>
        <div className="field-row">
          <label>Precio:</label>
          <span>${product.price}</span>
        </div>
        <div className="field-row">
          <label>Vendedor:</label>
          <span>{product.seller}</span>
        </div>
        <div className="field-row">
          <label>Categoría:</label>
          <span>{product.category}</span>
        </div>
        <div className="field-row">
          <label>Publicado:</label>
          <span>{formatDate(product.createdAt)}</span>
        </div>
        {product.updatedAt !== product.createdAt && (
          <div className="field-row">
            <label>Actualizado:</label>
            <span>{formatDate(product.updatedAt)}</span>
          </div>
        )}
      </fieldset>

      {isOwner && (
        <div className="detail-actions">
          <button type="button" onClick={() => navigate(`/product/${product._id}/edit`)}>
            Editar
          </button>
          <button type="button" onClick={() => setConfirming(true)}>
            Eliminar
          </button>
        </div>
      )}

      {confirming && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="window confirm-window">
            <div className="title-bar">
              <div className="title-bar-text">Confirmar eliminación</div>
              <div className="title-bar-controls">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setConfirming(false)}
                />
              </div>
            </div>
            <div className="window-body">
              <p>
                ¿Eliminar «{product.name}»? Esta acción no se puede deshacer.
              </p>
              <div className="confirm-actions">
                <button type="button" onClick={handleDelete}>
                  Eliminar
                </button>
                <button type="button" onClick={() => setConfirming(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;
