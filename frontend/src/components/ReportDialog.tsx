import { useState } from "react";
import type { FormEvent } from "react";
import ModalWindow from "./ModalWindow";
import { REPORT_REASON_LABELS } from "../types/reports";
import type { ReportData, ReportReason } from "../types/reports";
import useUiStore from "../store/uiStore";

interface ReportDialogProps {
  title: string;
  onSubmit: (data: ReportData) => Promise<unknown>;
  onClose: () => void;
}

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

const ReportDialog = ({ title, onSubmit, onClose }: ReportDialogProps) => {
  const notify = useUiStore((state) => state.notify);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setFieldError("Elige un motivo");
      return;
    }
    setFieldError(null);
    setSending(true);
    onSubmit({ reason, details: details.trim() || null })
      .then(() => {
        notify(
          "Gracias, tu reporte fue enviado. Un moderador lo revisará.",
          "success",
        );
        onClose();
      })
      .catch((err) => {
        notify(
          err?.response?.data?.error || "Error al enviar el reporte",
          "error",
        );
        setSending(false);
      });
  };

  return (
    <ModalWindow
      title={title}
      className="confirm-window"
      size={360}
      onClose={onClose}
    >
      <form className="comment-form" onSubmit={handleSubmit}>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason | "")}
        >
          <option value="">Motivo</option>
          {REASONS.map((key) => (
            <option key={key} value={key}>
              {REPORT_REASON_LABELS[key]}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Detalles (opcional)"
          rows={3}
          maxLength={200}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        {fieldError && <p className="field-error">{fieldError}</p>}
        <div className="dialog-buttons">
          <button type="submit" disabled={sending}>
            Enviar reporte
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </ModalWindow>
  );
};

export default ReportDialog;
