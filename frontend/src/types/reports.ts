import type { Product } from "./products";
import type { ModerationComment } from "./comments";
import type { ModerationReview } from "./reviews";

export type ReportReason = "illegal" | "scam" | "offensive" | "other";

export type ReportTargetType = "product" | "comment" | "review";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  illegal: "Contenido ilegal o prohibido",
  scam: "Estafa o spam",
  offensive: "Contenido ofensivo",
  other: "Otro",
};

export interface ReportData {
  reason: ReportReason;
  details?: string | null;
}

export interface ReportEntry {
  _id: string;
  reason: ReportReason;
  details: string | null;
  reporter: string | null;
  createdAt: string;
}

interface ReportGroupBase {
  count: number;
  reports: ReportEntry[];
}

export interface ProductReportGroup extends ReportGroupBase {
  targetType: "product";
  target: Product;
}

export interface CommentReportGroup extends ReportGroupBase {
  targetType: "comment";
  target: ModerationComment;
}

export interface ReviewReportGroup extends ReportGroupBase {
  targetType: "review";
  target: ModerationReview;
}

export type ModerationReportGroup =
  ProductReportGroup | CommentReportGroup | ReviewReportGroup;
