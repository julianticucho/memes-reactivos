import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { Product } from "../types/products";
import type { ModerationComment } from "../types/comments";
import type { ModerationReview } from "../types/reviews";
import type { ModerationReportGroup } from "../types/reports";
import moderationService from "../services/moderation";
import productsService from "../services/products";
import ProductDetail from "./ProductDetail";
import Tabs from "../components/Tabs";
import ModerationComments from "../components/ModerationComments";
import ModerationReviews from "../components/ModerationReviews";
import ModerationReports from "../components/ModerationReports";
import useUiStore from "../store/uiStore";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Moderation = () => {
  const notify = useUiStore((state) => state.notify);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const openId = params.get("product");
  const [products, setProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [reports, setReports] = useState<ModerationReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  const closeDetail = () => {
    const next = new URLSearchParams(params);
    next.delete("product");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    Promise.all([
      moderationService.getPending(),
      moderationService.getPendingComments(),
      moderationService.getPendingReviews(),
      moderationService.getReports(),
    ])
      .then(
        ([pendingProducts, pendingComments, pendingReviews, reportGroups]) => {
          setProducts(pendingProducts);
          setComments(pendingComments);
          setReviews(pendingReviews);
          setReports(reportGroups);
        },
      )
      .catch(() => notify("No se pudo cargar la cola de moderación", "error"))
      .finally(() => setLoading(false));
  }, []);

  const removeFromList = (id: string) =>
    setProducts((prev) => prev.filter((p) => p._id !== id));

  const removeCommentFromList = (id: string) =>
    setComments((prev) => prev.filter((c) => c._id !== id));

  const removeReviewFromList = (id: string) =>
    setReviews((prev) => prev.filter((r) => r._id !== id));

  const removeReportGroup = (group: ModerationReportGroup) =>
    setReports((prev) =>
      prev.filter(
        (g) =>
          !(
            g.targetType === group.targetType &&
            g.target._id === group.target._id
          ),
      ),
    );

  // Al borrarse un producto también se borran sus comentarios (y sus reportes).
  const handleProductDeleted = (id: string) => {
    removeFromList(id);
    setReports((prev) =>
      prev.filter((g) => {
        if (g.targetType === "product") return g.target._id !== id;
        if (g.targetType === "comment") return g.target.product?._id !== id;
        return true;
      }),
    );
  };

  const handleApprove = (product: Product) => {
    moderationService
      .approve(product._id)
      .then(() => {
        removeFromList(product._id);
        notify(`«${product.name}» aprobado`, "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al aprobar";
        notify(msg, "error");
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
        notify(`«${product.name}» eliminado`, "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al eliminar";
        notify(msg, "error");
      });
  };

  const handleApproveComment = (comment: ModerationComment) => {
    moderationService
      .approveComment(comment._id)
      .then(() => {
        removeCommentFromList(comment._id);
        notify("Comentario aprobado", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al aprobar";
        notify(msg, "error");
      });
  };

  const handleDeleteComment = (comment: ModerationComment) => {
    moderationService
      .removeComment(comment._id)
      .then(() => {
        removeCommentFromList(comment._id);
        notify("Comentario eliminado", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al eliminar";
        notify(msg, "error");
      });
  };

  const handleApproveReview = (review: ModerationReview) => {
    moderationService
      .approveReview(review._id)
      .then(() => {
        removeReviewFromList(review._id);
        notify("Reseña aprobada", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al aprobar";
        notify(msg, "error");
      });
  };

  const handleDeleteReview = (review: ModerationReview) => {
    moderationService
      .removeReview(review._id)
      .then(() => {
        removeReviewFromList(review._id);
        notify("Reseña eliminada", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al eliminar";
        notify(msg, "error");
      });
  };

  const handleDismissReports = (group: ModerationReportGroup) => {
    moderationService
      .dismissReports(group.targetType, group.target._id)
      .then(() => {
        removeReportGroup(group);
        notify("Reportes descartados", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al descartar";
        notify(msg, "error");
      });
  };

  const handleDeleteReported = (group: ModerationReportGroup) => {
    const request =
      group.targetType === "product"
        ? productsService.remove(group.target._id)
        : group.targetType === "comment"
          ? moderationService.removeComment(group.target._id)
          : moderationService.removeReview(group.target._id);
    request
      .then(() => {
        if (group.targetType === "product") {
          handleProductDeleted(group.target._id);
        } else {
          removeReportGroup(group);
          if (group.targetType === "comment") {
            removeCommentFromList(group.target._id);
          } else {
            removeReviewFromList(group.target._id);
          }
        }
        notify("Contenido eliminado", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Error al eliminar";
        notify(msg, "error");
      });
  };

  if (loading) return <p>Cargando...</p>;

  const productsTab =
    products.length === 0 ? (
      <p className="empty-state">No hay publicaciones pendientes de revisión</p>
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
                  <Link to={`/profile/${product.user}`}>{product.seller}</Link>
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
    );

  return (
    <>
      <h1>Moderación</h1>

      <Tabs
        ariaLabel="Cola de moderación"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            key: "products",
            label: `Productos (${products.length})`,
            content: productsTab,
          },
          {
            key: "comments",
            label: `Comentarios (${comments.length})`,
            content: (
              <ModerationComments
                comments={comments}
                onApprove={handleApproveComment}
                onDelete={handleDeleteComment}
              />
            ),
          },
          {
            key: "reviews",
            label: `Reseñas (${reviews.length})`,
            content: (
              <ModerationReviews
                reviews={reviews}
                onApprove={handleApproveReview}
                onDelete={handleDeleteReview}
              />
            ),
          },
          {
            key: "reports",
            label: `Reportes (${reports.length})`,
            content: (
              <ModerationReports
                groups={reports}
                onViewProduct={(id) => navigate(`/moderation?product=${id}`)}
                onDismiss={handleDismissReports}
                onDelete={handleDeleteReported}
              />
            ),
          },
        ]}
      />

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
          onClose={closeDetail}
          onDeleted={handleProductDeleted}
        />
      )}
    </>
  );
};

export default Moderation;
