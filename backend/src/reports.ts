import type mongoose from "mongoose";
import Report, {
  REPORT_REASONS,
  type ReportDocument,
  type ReportReason,
  type ReportTarget,
} from "./models/report.js";

const MAX_DETAILS = 200;

export const fileReport = async (
  targetType: ReportTarget,
  target: mongoose.Types.ObjectId,
  reporter: string | undefined,
  body: { reason?: unknown; details?: unknown },
): Promise<{ error: string } | { report: ReportDocument }> => {
  const { reason, details } = body;
  if (!REPORT_REASONS.includes(reason as ReportReason)) {
    return { error: "motivo de reporte inválido" };
  }
  if (
    details !== undefined &&
    details !== null &&
    (typeof details !== "string" || details.trim().length > MAX_DETAILS)
  ) {
    return {
      error: `el detalle debe tener como máximo ${MAX_DETAILS} caracteres`,
    };
  }
  const existing = await Report.findOne({ targetType, target, reporter });
  if (existing) {
    return { error: "ya reportaste este contenido" };
  }
  const report = await new Report({
    targetType,
    target,
    reporter,
    reason,
    details:
      typeof details === "string" && details.trim() ? details.trim() : null,
  }).save();
  return { report };
};
