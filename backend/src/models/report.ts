import mongoose from "mongoose";

export const REPORT_REASONS = [
  "illegal",
  "scam",
  "offensive",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_TARGETS = ["product", "comment", "review"] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export interface ReportDocument extends mongoose.Document {
  targetType: ReportTarget;
  target: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  reason: ReportReason;
  details: string | null;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: REPORT_TARGETS,
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    details: {
      type: String,
      default: null,
      maxlength: 200,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

reportSchema.index({ reporter: 1, targetType: 1, target: 1 }, { unique: true });

reportSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    const { __v, ...rest } = returnedObject;
    return rest;
  },
});

const Report = mongoose.model<ReportDocument>("Report", reportSchema);

export default Report;
