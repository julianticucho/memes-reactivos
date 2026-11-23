import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../types/products";
import productsService from "../services/products";
import Tabs from "../components/Tabs";
import ModalWindow from "../components/ModalWindow";
import CommentSection from "../components/CommentSection";
import ReportDialog from "../components/ReportDialog";
import reportsService from "../services/reports";
import FavoriteButton from "../components/FavoriteButton";
import { isStaff } from "../utils/roles";
import useAuthStore from "../store/authStore";
import useProductsStore from "../store/productsStore";
import useUiStore from "../store/uiStore";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

const ProductDetail = ({
  productId,
  onClose,
  onDeleted,
}: ProductDetailProps) => {
  const user = useAuthStore((state) => state.user);
  const removeProduct = useProductsStore((state) => state.removeProduct);
  const notify = useUiStore((state) => state.notify);
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [viewingImage, setViewingImage] = useState(false);
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
        setViewingImage(false);
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
        removeProduct(product._id);
        notify("Producto eliminado", "success");
        onDeleted?.(product._id);
        onClose();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error || "Error al eliminar (¿sesión expirada?)";
        notify(msg, "error");
      });
  };

  const handleClose = () => onClose();

  if (loading || !product) {
    return createPortal(
      <ModalWindow
        title="Detalle de producto"
        className="detail-window"
        size={460}
        onClose={handleClose}
      >
        <p>{loading ? "Cargando..." : "Producto no encontrado"}</p>
      </ModalWindow>,
      document.body,
    );
  }

  const isOwner = !!user && product.user === user.id;
  const canManage = isOwner || isStaff(user);
  const canReport = !!user && !canManage && product.status === "active";
  const images = product.image ?? [];
  const total = images.length;

  return createPortal(
    <>
      <ModalWindow
        title={product.name}
        className="detail-window"
        size={460}
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
                    <FavoriteButton
                      productId={product._id}
                      initialCount={product.favoriteCount ?? 0}
                    />
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
                  <br />
                  <div className="monitor">
                    <div className="monitor-screen">
                      {total > 0 ? (
                        <img
                          src={images[imgIdx]}
                          alt={`${product.name} ${imgIdx + 1} de ${total}`}
                          className="monitor-zoom"
                          onClick={() => setViewingImage(true)}
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

                  {(canManage || canReport) && (
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
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setConfirming(true)}
                        >
                          Eliminar
                        </button>
                      )}
                      {canReport && (
                        <button
                          type="button"
                          onClick={() => setReporting(true)}
                        >
                          Reportar
                        </button>
                      )}
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

      {reporting && (
        <ReportDialog
          title="Reportar publicación"
          onSubmit={(data) => reportsService.reportProduct(product._id, data)}
          onClose={() => setReporting(false)}
        />
      )}

      {viewingImage && total > 0 && (
        <ModalWindow
          title={`${product.name} — imagen ${imgIdx + 1} de ${total}`}
          className="image-viewer-window"
          size={640}
          onClose={() => setViewingImage(false)}
        >
          <img
            src={images[imgIdx]}
            alt={`${product.name} ${imgIdx + 1} de ${total}`}
            className="image-viewer-img"
          />
        </ModalWindow>
      )}
    </>,
    document.body,
  );
};

export default ProductDetail;
