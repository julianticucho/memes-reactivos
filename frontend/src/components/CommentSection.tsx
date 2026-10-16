import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Comment } from "../types/comments";
import type { User } from "../types/users";
import commentsService from "../services/comments";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface CommentSectionProps {
  productId: string;
  user: User | null;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
  onCountChange?: (count: number) => void;
}

const CommentSection = ({
  productId,
  user,
  setToast,
  onCountChange,
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    commentsService
      .getByProduct(productId)
      .then((data) => {
        setComments(data);
        onCountChange?.(data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const reload = () => {
    commentsService
      .getByProduct(productId)
      .then((data) => {
        setComments(data);
        onCountChange?.(data.length);
      })
      .catch(() => {});
  };

  const showError = (
    err: { response?: { data?: { error?: string } } },
    fallback: string,
  ) => {
    const msg = err?.response?.data?.error || fallback;
    setToast({ message: msg, severity: "error" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setFieldError("El comentario no puede estar vacío");
      return;
    }
    setFieldError(null);
    commentsService
      .create(productId, text.trim())
      .then(() => {
        setText("");
        setToast({ message: "Comentario publicado", severity: "success" });
        reload();
      })
      .catch((err) => showError(err, "Error al comentar (¿sesión expirada?)"));
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
    setEditError(null);
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) {
      setEditError("El comentario no puede estar vacío");
      return;
    }
    commentsService
      .update(id, editText.trim())
      .then(() => {
        setEditingId(null);
        setToast({ message: "Comentario actualizado", severity: "success" });
        reload();
      })
      .catch((err) => showError(err, "Error al editar el comentario"));
  };

  const handleDelete = () => {
    if (!confirmingId) return;
    const id = confirmingId;
    setConfirmingId(null);
    commentsService
      .remove(id)
      .then(() => {
        setToast({ message: "Comentario eliminado", severity: "success" });
        reload();
      })
      .catch((err) => showError(err, "Error al eliminar el comentario"));
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      {comments.length === 0 ? (
        <p className="empty-state">
          No hay comentarios todavía. ¡Sé el primero en preguntar!
        </p>
      ) : (
        <ul className="tree-view comment-list">
          {comments.map((comment) => (
            <li key={comment._id}>
              <div className="comment-meta">
                <span className="comment-author">{comment.username}</span>
                <span className="comment-date">
                  {formatDate(comment.createdAt)}
                </span>
                {user?.id === comment.user && (
                  <span className="comment-actions">
                    <button type="button" onClick={() => startEditing(comment)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(comment._id)}
                    >
                      Eliminar
                    </button>
                  </span>
                )}
              </div>
              {editingId === comment._id ? (
                <div className="comment-edit">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  {editError && <p className="field-error">{editError}</p>}
                  <div className="dialog-buttons">
                    <button
                      type="button"
                      onClick={() => handleUpdate(comment._id)}
                    >
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="comment-form" onSubmit={handleCreate}>
          <textarea
            placeholder="Escribe tu pregunta o comentario..."
            rows={3}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {fieldError && <p className="field-error">{fieldError}</p>}
          <div className="dialog-buttons">
            <button type="submit">Comentar</button>
          </div>
        </form>
      ) : (
        <p className="empty-state">
          <Link to="/login">Inicia sesión</Link> para comentar.
        </p>
      )}

      {confirmingId && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="window confirm-window">
            <div className="title-bar">
              <div className="title-bar-text">Confirmar eliminación</div>
              <div className="title-bar-controls">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setConfirmingId(null)}
                />
              </div>
            </div>
            <div className="window-body">
              <p>
                ¿Eliminar este comentario? Esta acción no se puede deshacer.
              </p>
              <div className="confirm-actions">
                <button type="button" onClick={handleDelete}>
                  Eliminar
                </button>
                <button type="button" onClick={() => setConfirmingId(null)}>
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

export default CommentSection;
