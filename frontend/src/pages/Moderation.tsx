import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import moderationService from "../services/moderation";
import productsService from "../services/products";
import ProductDetail from "./ProductDetail";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ModerationProps {
  user: User | null;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Moderation = ({ user, setToast }: ModerationProps) => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const openId = params.get("product");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const closeDetail = () => {
    const next = new URLSearchParams(params);
    next.delete("product");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    moderationService
      .getPending()
      .then(setProducts)
      .catch(() =>
        setToast({
          message: "No se pudo cargar la cola de moderación",
          severity: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const removeFromList = (id: string) =>
    setProducts((prev) => prev.filter((p) => p._id !== id));

  const handleApprove = (product: Product) => {
    moderationService
      .approve(product._id)
      .then(() => {
        removeFromList(product._id);
        setToast({
          message: `«${product.name}» aprobado`,
          severity: "success",
        });
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al aprobar";
        setToast({ message: msg, severity: "error" });
      });
  };

  const handleDelete = () => {
    if (!deleting) return;
    const product = deleting;
    setDeleting(null);
    productsService
      .remove(product._id)
      .then(() => {
        removeFromList(product._id);
        setToast({
          message: `«${product.name}» eliminado`,
          severity: "success",
        });
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al eliminar";
        setToast({ message: msg, severity: "error" });
      });
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <h1>Moderación ({products.length} pendientes)</h1>

      {products.length === 0 ? (
        <p className="empty-state">
          No hay publicaciones pendientes de revisión
        </p>
      ) : (
        products.map((product) => (
          <fieldset key={product._id} className="moderation-item">
            <legend>{product.name}</legend>
            <div className="moderation-body">
              <img
                src={product.image?.[0] || "/no-image.avif"}
                alt={product.name}
              />
              <div>
                <p>
                  <span className="info-label">Vendedor: </span>
                  {product.user ? (
                    <Link to={`/profile/${product.user}`}>
                      {product.seller}
                    </Link>
                  ) : (
                    product.seller
                  )}
                </p>
                <p>
                  <span className="info-label">Categoría: </span>
                  {product.category}
                </p>
                <p>
                  <span className="info-label">Precio: </span>${product.price}
                </p>
                <p>
                  <span className="info-label">Publicado: </span>
                  {formatDate(product.createdAt)}
                </p>
                <p className="moderation-description">{product.description}</p>
              </div>
            </div>
            <div className="dialog-buttons">
              <button
                type="button"
                onClick={() => navigate(`/moderation?product=${product._id}`)}
              >
                Ver detalle
              </button>
              <button type="button" onClick={() => handleApprove(product)}>
                Aprobar
              </button>
              <button type="button" onClick={() => setDeleting(product)}>
                Eliminar
              </button>
            </div>
          </fieldset>
        ))
      )}

      {deleting && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="window confirm-window">
            <div className="title-bar">
              <div className="title-bar-text">Confirmar eliminación</div>
              <div className="title-bar-controls">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDeleting(null)}
                />
              </div>
            </div>
            <div className="window-body">
              <p>
                ¿Eliminar «{deleting.name}
                »? Esta acción no se puede deshacer.
              </p>
              <div className="confirm-actions">
                <button type="button" onClick={handleDelete}>
                  Eliminar
                </button>
                <button type="button" onClick={() => setDeleting(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openId && (
        <ProductDetail
          productId={openId}
          user={user}
          setToast={setToast}
          onClose={closeDetail}
          onDeleted={removeFromList}
        />
      )}
    </>
  );
};

export default Moderation;
