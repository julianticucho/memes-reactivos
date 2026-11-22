import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { ModerationReview } from "../types/reviews";
import ModalWindow from "./ModalWindow";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ModerationReviewsProps {
  reviews: ModerationReview[];
  onApprove: (review: ModerationReview) => void;
  onDelete: (review: ModerationReview) => void;
}

const ModerationReviews = ({
  reviews,
  onApprove,
  onDelete,
}: ModerationReviewsProps) => {
  const [deleting, setDeleting] = useState<ModerationReview | null>(null);

  if (reviews.length === 0) {
    return <p className="empty-state">No hay reseñas pendientes de revisión</p>;
  }

  const handleConfirmDelete = () => {
    if (!deleting) return;
    const review = deleting;
    setDeleting(null);
    onDelete(review);
  };

  return (
    <>
      {reviews.map((review) => (
        <fieldset key={review._id} className="moderation-item">
          <legend>{review.username}</legend>
          <p>
            <span className="info-label">Reseña a: </span>
            {review.reviewedUser ? (
              <Link to={`/profile/${review.reviewedUser._id}`}>
                {review.reviewedUser.username}
              </Link>
            ) : (
              "Usuario eliminado"
            )}
          </p>
          <p>
            <span className="info-label">Voto: </span>
            <span
              className={`vote-badge ${
                review.vote === 1 ? "vote-up" : "vote-down"
              }`}
            >
              {review.vote === 1 ? "+1" : "−1"}
            </span>
          </p>
          <p>
            <span className="info-label">Publicada: </span>
            {formatDate(review.createdAt)}
          </p>
          {review.text && (
            <p className="moderation-description">{review.text}</p>
          )}
          <div className="dialog-buttons">
            <button type="button" onClick={() => onApprove(review)}>
              Aprobar
            </button>
            <button type="button" onClick={() => setDeleting(review)}>
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
            <p>¿Eliminar esta reseña? Esta acción no se puede deshacer.</p>
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

export default ModerationReviews;
