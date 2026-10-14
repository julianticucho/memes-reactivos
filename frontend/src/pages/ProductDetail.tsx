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
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    productsService
      .getById(id)
      .then((data) => {
        setProduct(data);
        setImgIdx(0);
      })
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
  const images = product.image ?? [];
  const total = images.length;

  return (
    <>
      <div className="window detail-window">
        <div className="title-bar">
          <div className="title-bar-text">{product.name}</div>
          <div className="title-bar-controls">
            <button
              type="button"
              aria-label="Close"
              onClick={() => navigate("/")}
            />
          </div>
        </div>

        <div className="window-body">
          <div className="monitor">
            <div className="monitor-screen">
              {total > 0
                ? (
                    <img
                      src={images[imgIdx]}
                      alt={`${product.name} ${imgIdx + 1} de ${total}`}
                    />
                  )
                : (
                    <span className="no-image">Sin imagen</span>
                  )}
            </div>
            <div className="monitor-stand" />
          </div>

          {total > 1 && (
            <div className="image-pager">
              <button
                type="button"
                aria-label="Imagen anterior"
                disabled={imgIdx === 0}
                onClick={() => setImgIdx((i) => i - 1)}
              >
                ◀
              </button>
              <span>
                {imgIdx + 1}
                {" / "}
                {total}
              </span>
              <button
                type="button"
                aria-label="Imagen siguiente"
                disabled={imgIdx === total - 1}
                onClick={() => setImgIdx((i) => i + 1)}
              >
                ▶
              </button>
            </div>
          )}

          <p>Información:</p>
          <ul className="tree-view info-box">
            <li>
              <span className="info-label">Precio: </span>
              $
              {product.price}
            </li>
            <li>
              <span className="info-label">Vendedor: </span>
              {product.seller}
            </li>
            <li>
              <span className="info-label">Categoría: </span>
              {product.category}
            </li>
            <li>
              <span className="info-label">Publicado: </span>
              {formatDate(product.createdAt)}
            </li>
            {product.updatedAt !== product.createdAt && (
              <li>
                <span className="info-label">Actualizado: </span>
                {formatDate(product.updatedAt)}
              </li>
            )}
            <li>
              <span className="info-label">Descripción:</span>
              <div className="info-desc">{product.description}</div>
            </li>
          </ul>

          <div className="dialog-buttons">
            <button
              type="button"
              disabled
              title="Los comentarios aún no están implementados en el backend"
            >
              Comentar
            </button>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/product/${product._id}/edit`)}
                >
                  Editar
                </button>
                <button type="button" onClick={() => setConfirming(true)}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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
                ¿Eliminar «
                {product.name}
                »? Esta acción no se puede deshacer.
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
