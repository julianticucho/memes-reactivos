import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { ModerationComment } from "../types/comments";
import ModalWindow from "./ModalWindow";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ModerationCommentsProps {
  comments: ModerationComment[];
  onApprove: (comment: ModerationComment) => void;
  onDelete: (comment: ModerationComment) => void;
}

const ModerationComments = ({
  comments,
  onApprove,
  onDelete,
}: ModerationCommentsProps) => {
  const [deleting, setDeleting] = useState<ModerationComment | null>(null);

  if (comments.length === 0) {
    return (
      <p className="empty-state">No hay comentarios pendientes de revisión</p>
    );
  }

  const handleConfirmDelete = () => {
    if (!deleting) return;
    const comment = deleting;
    setDeleting(null);
    onDelete(comment);
  };

  return (
    <>
      {comments.map((comment) => (
        <fieldset key={comment._id} className="moderation-item">
          <legend>{comment.username}</legend>
          <p>
            <span className="info-label">Producto: </span>
            {comment.product ? (
              <Link to={`/?product=${comment.product._id}`}>
                {comment.product.name}
              </Link>
            ) : (
              "Producto eliminado"
            )}
          </p>
          <p>
            <span className="info-label">Publicado: </span>
            {formatDate(comment.createdAt)}
          </p>
          <p className="moderation-description">{comment.text}</p>
          <div className="dialog-buttons">
            <button type="button" onClick={() => onApprove(comment)}>
              Aprobar
            </button>
            <button type="button" onClick={() => setDeleting(comment)}>
              Eliminar
            </button>
          </div>
        </fieldset>
      ))}

      {deleting &&
        createPortal(
          <ModalWindow
            title="Confirmar eliminación"
            className="confirm-window"
            size={320}
            onClose={() => setDeleting(null)}
          >
            <p>¿Eliminar este comentario? Esta acción no se puede deshacer.</p>
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

export default ModerationComments;
