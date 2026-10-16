import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { Review, ReviewsResponse } from "../types/reviews";
import type { User } from "../types/users";
import reviewsService from "../services/reviews";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface ReviewSectionProps {
  profileId: string;
  user: User | null;
  data: ReviewsResponse;
  onChanged: () => void;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const ReviewSection = ({
  profileId,
  user,
  data,
  onChanged,
  setToast,
}: ReviewSectionProps) => {
  const [text, setText] = useState("");
  const [vote, setVote] = useState<1 | -1 | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editVote, setEditVote] = useState<1 | -1 | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isOwnProfile = !!user && user.id === profileId;

  const myReview: Review | undefined = data.reviews.find(
    (review) => review.user === user?.id,
  );

  // La reseña propia encabeza la lista: su voto (+1/-1) se ve de inmediato.
  const orderedReviews: Review[] = myReview
    ? [myReview, ...data.reviews.filter((review) => review !== myReview)]
    : data.reviews;

  const showError = (
    err: { response?: { data?: { error?: string } } },
    fallback: string,
  ) => {
    const msg = err?.response?.data?.error || fallback;
    setToast({ message: msg, severity: "error" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vote) {
      setFieldError("Elige +1 o -1 para calificar la experiencia");
      return;
    }
    setFieldError(null);
    reviewsService
      .create(profileId, { text: text.trim() || null, vote })
      .then(() => {
        setText("");
        setVote(null);
        setToast({ message: "Reseña publicada", severity: "success" });
        onChanged();
      })
      .catch((err) => showError(err, "Error al publicar la reseña"));
  };

  const startEditing = () => {
    if (!myReview) return;
    setEditing(true);
    setEditText(myReview.text ?? "");
    setEditVote(myReview.vote);
    setEditError(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVote) {
      setEditError("Elige +1 o -1 para calificar la experiencia");
      return;
    }
    setEditError(null);
    reviewsService
      .update(profileId, { text: editText.trim() || null, vote: editVote })
      .then(() => {
        setEditing(false);
        setToast({ message: "Reseña actualizada", severity: "success" });
        onChanged();
      })
      .catch((err) => showError(err, "Error al editar la reseña"));
  };

  const handleDelete = () => {
    setConfirming(false);
    reviewsService
      .remove(profileId)
      .then(() => {
        setToast({ message: "Reseña eliminada", severity: "success" });
        onChanged();
      })
      .catch((err) => showError(err, "Error al eliminar la reseña"));
  };

  const { stats } = data;

  return (
    <>
      <p className="reputation-summary">
        <span className="info-label">Reputación: </span>
        {stats.score > 0 ? `+${stats.score}` : stats.score}
        {" · "}a favor: {stats.upvotes}
        {" · "}
        en contra: {stats.downvotes}
      </p>

      {orderedReviews.length === 0 ? (
        <p className="empty-state">Aún no hay reseñas.</p>
      ) : (
        <ul className="tree-view review-list">
          {orderedReviews.map((review) => (
            <li
              key={review._id}
              className={review.user === user?.id ? "review-mine" : undefined}
            >
              <div className="review-meta">
                <span
                  className={`vote-badge ${
                    review.vote === 1 ? "vote-up" : "vote-down"
                  }`}
                >
                  {review.vote === 1 ? "+1" : "−1"}
                </span>
                <span className="comment-author">{review.username}</span>
                <span className="comment-date">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.text && <p className="comment-text">{review.text}</p>}
            </li>
          ))}
        </ul>
      )}

      {!user ? (
        <p className="empty-state">
          <Link to="/login">Inicia sesión</Link> para dejar una reseña.
        </p>
      ) : isOwnProfile ? (
        <p className="empty-state">No puedes reseñar tu propio perfil.</p>
      ) : myReview && !editing ? (
        <div className="my-review">
          <p className="info-label">Tu reseña:</p>
          <p className="comment-text">
            <span
              className={`vote-badge ${
                myReview.vote === 1 ? "vote-up" : "vote-down"
              }`}
            >
              {myReview.vote === 1 ? "+1" : "−1"}
            </span>{" "}
            {myReview.text || "Sin comentarios"}
          </p>
          <div className="dialog-buttons">
            <button type="button" onClick={startEditing}>
              Editar
            </button>
            <button type="button" onClick={() => setConfirming(true)}>
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <form
          className="comment-form"
          onSubmit={editing ? handleUpdate : handleCreate}
        >
          {editing && <p className="info-label">Editando tu reseña...</p>}
          <div className="review-votes">
            <div className="field-row">
              <input
                id={editing ? "edit-vote-up" : "vote-up"}
                type="radio"
                name={editing ? "edit-vote" : "vote"}
                checked={(editing ? editVote : vote) === 1}
                onChange={() => (editing ? setEditVote(1) : setVote(1))}
              />
              <label htmlFor={editing ? "edit-vote-up" : "vote-up"}>
                +1 Buena experiencia
              </label>
            </div>
            <div className="field-row">
              <input
                id={editing ? "edit-vote-down" : "vote-down"}
                type="radio"
                name={editing ? "edit-vote" : "vote"}
                checked={(editing ? editVote : vote) === -1}
                onChange={() => (editing ? setEditVote(-1) : setVote(-1))}
              />
              <label htmlFor={editing ? "edit-vote-down" : "vote-down"}>
                −1 Mala experiencia
              </label>
            </div>
          </div>
          <textarea
            placeholder="Cuenta cómo fue tu experiencia (opcional)..."
            rows={3}
            maxLength={500}
            value={editing ? editText : text}
            onChange={(e) =>
              editing ? setEditText(e.target.value) : setText(e.target.value)
            }
          />
          {editing
            ? editError && <p className="field-error">{editError}</p>
            : fieldError && <p className="field-error">{fieldError}</p>}
          <div className="dialog-buttons">
            <button type="submit">
              {editing ? "Guardar cambios" : "Publicar reseña"}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
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
              <p>¿Eliminar tu reseña? Esta acción no se puede deshacer.</p>
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

export default ReviewSection;
