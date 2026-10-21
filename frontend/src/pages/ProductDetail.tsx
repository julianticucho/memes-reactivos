import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../types/products";
import type { User } from "../types/users";
import productsService from "../services/products";
import Tabs from "../components/Tabs";
import ModalWindow from "../components/ModalWindow";
import CommentSection from "../components/CommentSection";
import { isStaff } from "../utils/roles";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ProductDetailProps {
  user: User | null;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
  productId: string;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

const ProductDetail = ({
  user,
  setToast,
  productId,
  onClose,
  onDeleted,
}: ProductDetailProps) => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("publicacion");
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsService
      .getById(productId)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setImgIdx(0);
        setActiveTab("publicacion");
        setCommentCount(0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleDelete = () => {
    if (!product) return;
    setConfirming(false);
    productsService
      .remove(product._id)
      .then(() => {
        setToast({ message: "Producto eliminado", severity: "success" });
        onDeleted?.(product._id);
        onClose();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error || "Error al eliminar (¿sesión expirada?)";
        setToast({ message: msg, severity: "error" });
      });
  };

  const handleClose = () => onClose();

  if (loading || !product) {
    return createPortal(
      <ModalWindow
        title="Detalle de producto"
        className="detail-window"
        onClose={handleClose}
      >
        <p>{loading ? "Cargando..." : "Producto no encontrado"}</p>
      </ModalWindow>,
      document.body,
    );
  }

  const isOwner = !!user && product.user === user.id;
  const images = product.image ?? [];
  const total = images.length;

  return createPortal(
    <>
      <ModalWindow
        title={product.name}
        className="detail-window"
        onClose={handleClose}
      >
        <Tabs
          ariaLabel="Detalle del producto"
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              key: "publicacion",
              label: "Publicación",
              content: (
                <>
                  {product.status === "pending" && (
                    <p>
                      <strong>En revisión: </strong>
                      esta publicación aún no es visible para el público.
                    </p>
                  )}
                  <div className="detail-header">
                    <p className="detail-name">{product.name}</p>
                    <p className="detail-price">${product.price}</p>
                    <p className="detail-seller">
                      <span className="info-label">Vendedor: </span>
                      {product.user ? (
                        <Link to={`/profile/${product.user}`}>
                          {product.seller}
                        </Link>
                      ) : (
                        product.seller
                      )}
                    </p>
                  </div>

                  <div className="monitor">
                    <div className="monitor-screen">
                      {total > 0 ? (
                        <img
                          src={images[imgIdx]}
                          alt={`${product.name} ${imgIdx + 1} de ${total}`}
                        />
                      ) : (
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
                        &lt;
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
                        &gt;
                      </button>
                    </div>
                  )}

                  <fieldset>
                    <legend>Mas informacion</legend>
                    <p>
                      <span className="info-label">Descripción: </span>
                      {product.description}
                    </p>
                    <p>
                      <span className="info-label">Categoría: </span>
                      {product.category}
                    </p>
                    <p>
                      <span className="info-label">Publicado: </span>
                      {formatDate(product.createdAt)}
                      {product.updatedAt !== product.createdAt && (
                        <>
                          {" · "}
                          <span className="info-label">Actualizado: </span>
                          {formatDate(product.updatedAt)}
                        </>
                      )}
                    </p>
                  </fieldset>

                  {(isOwner || isStaff(user)) && (
                    <div className="dialog-buttons">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/product/${product._id}/edit`)
                          }
                        >
                          Editar
                        </button>
                      )}
                      <button type="button" onClick={() => setConfirming(true)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </>
              ),
            },
            {
              key: "comentarios",
              label: `Comentarios (${commentCount})`,
              content: (
                <CommentSection
                  productId={product._id}
                  user={user}
                  setToast={setToast}
                  onCountChange={setCommentCount}
                />
              ),
            },
          ]}
        />
      </ModalWindow>

      {confirming && (
        <ModalWindow
          title="Confirmar eliminación"
          className="confirm-window"
          size={320}
          onClose={() => setConfirming(false)}
        >
          <p>
            ¿Eliminar «{product.name}
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
        </ModalWindow>
      )}
    </>,
    document.body,
  );
};

export default ProductDetail;
