import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { ModerationReportGroup } from "../types/reports";
import { REPORT_REASON_LABELS } from "../types/reports";
import ModalWindow from "./ModalWindow";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ModerationReportsProps {
  groups: ModerationReportGroup[];
  onViewProduct: (productId: string) => void;
  onDismiss: (group: ModerationReportGroup) => void;
  onDelete: (group: ModerationReportGroup) => void;
}

const ModerationReports = ({
  groups,
  onViewProduct,
  onDismiss,
  onDelete,
}: ModerationReportsProps) => {
  const [deleting, setDeleting] = useState<ModerationReportGroup | null>(null);

  if (groups.length === 0) {
    return (
      <p className="empty-state">No hay reportes pendientes de revisión</p>
    );
  }

  const handleConfirmDelete = () => {
    if (!deleting) return;
    const group = deleting;
    setDeleting(null);
    onDelete(group);
  };

  return (
    <>
      {groups.map((group) => {
        const key = `${group.targetType}:${group.target._id}`;
        const productId =
          group.targetType === "product"
            ? group.target._id
            : group.targetType === "comment"
              ? group.target.product?._id
              : undefined;
        return (
          <fieldset key={key} className="moderation-item">
            <legend>
              {group.targetType === "product"
                ? group.target.name
                : group.targetType === "comment"
                  ? `Comentario de ${group.target.username}`
                  : `Reseña de ${group.target.username}`}
            </legend>

            {group.targetType === "product" ? (
              <>
                <p>
                  <span className="info-label">Vendedor: </span>
                  {group.target.seller}
                </p>
                <p>
                  <span className="info-label">Categoría: </span>
                  {group.target.category}
                  {" · "}
                  <span className="info-label">Precio: </span>$
                  {group.target.price}
                </p>
                <p className="moderation-description">
                  {group.target.description}
                </p>
              </>
            ) : group.targetType === "comment" ? (
              <>
                <p>
                  <span className="info-label">Producto: </span>
                  {group.target.product ? (
                    <Link to={`/?product=${group.target.product._id}`}>
                      {group.target.product.name}
                    </Link>
                  ) : (
                    "Producto eliminado"
                  )}
                </p>
                <p className="moderation-description">{group.target.text}</p>
              </>
            ) : (
              <>
                <p>
                  <span className="info-label">Reseña a: </span>
                  {group.target.reviewedUser ? (
                    <Link to={`/profile/${group.target.reviewedUser._id}`}>
                      {group.target.reviewedUser.username}
                    </Link>
                  ) : (
                    "Usuario eliminado"
                  )}
                </p>
                <p>
                  <span className="info-label">Voto: </span>
                  <span
                    className={`vote-badge ${
                      group.target.vote === 1 ? "vote-up" : "vote-down"
                    }`}
                  >
                    {group.target.vote === 1 ? "+1" : "−1"}
                  </span>
                </p>
                {group.target.text && (
                  <p className="moderation-description">{group.target.text}</p>
                )}
              </>
            )}

            <p className="info-label">
              {group.count} {group.count === 1 ? "reporte" : "reportes"}
            </p>
            <ul className="report-list">
              {group.reports.map((report) => (
                <li key={report._id}>
                  <strong>{REPORT_REASON_LABELS[report.reason]}</strong>
                  {" · "}
                  {report.reporter ?? "usuario eliminado"}
                  {" · "}
                  {formatDate(report.createdAt)}
                  {report.details && (
                    <q className="report-details">{report.details}</q>
                  )}
                </li>
              ))}
            </ul>

            <div className="dialog-buttons">
              {productId && (
                <button type="button" onClick={() => onViewProduct(productId)}>
                  Ver publicación
                </button>
              )}
              <button type="button" onClick={() => onDismiss(group)}>
                Descartar reportes
              </button>
              <button type="button" onClick={() => setDeleting(group)}>
                Eliminar contenido
              </button>
            </div>
          </fieldset>
        );
      })}

      {deleting &&
        createPortal(
          <ModalWindow
            title="Confirmar eliminación"
            className="confirm-window"
            size={320}
            onClose={() => setDeleting(null)}
          >
            <p>
              {deleting.targetType === "product"
                ? "¿Eliminar esta publicación y sus comentarios?"
                : deleting.targetType === "comment"
                  ? "¿Eliminar este comentario?"
                  : "¿Eliminar esta reseña?"}{" "}
              Esta acción no se puede deshacer.
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={handleConfirmDelete}>
                Eliminar
              </button>
              <button type="button" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
            </div>
          </ModalWindow>,
          document.body,
        )}
    </>
  );
};

export default ModerationReports;
