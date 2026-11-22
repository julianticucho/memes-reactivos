import express from "express";
import Product from "../models/product.js";
import Comment from "../models/comment.js";
import Review from "../models/review.js";
import Report, {
  REPORT_TARGETS,
  type ReportReason,
  type ReportTarget,
} from "../models/report.js";
import { requireRole, withUser } from "../middleware.js";

const router = express.Router();

router.use(withUser, requireRole("moderator", "admin"));

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find({ status: "pending" }).sort({
      createdAt: 1,
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/products/:id/approve", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "producto no encontrado" });
    }
    product.status = "active";
    const approvedProduct = await product.save();
    res.json(approvedProduct);
  } catch (error) {
    next(error);
  }
});

router.get("/comments", async (_req, res, next) => {
  try {
    const comments = await Comment.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .populate("product", "name");
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.post("/comments/:id/approve", async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "comentario no encontrado" });
    }
    comment.status = "active";
    const approvedComment = await comment.save();
    res.json(approvedComment);
  } catch (error) {
    next(error);
  }
});

router.delete("/comments/:id", async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "comentario no encontrado" });
    }
    await Report.deleteMany({ targetType: "comment", target: comment._id });
    await comment.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/reviews", async (_req, res, next) => {
  try {
    const reviews = await Review.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .populate("reviewedUser", "username");
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post("/reviews/:id/approve", async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "reseña no encontrada" });
    }
    review.status = "active";
    const approvedReview = await review.save();
    res.json(approvedReview);
  } catch (error) {
    next(error);
  }
});

router.delete("/reviews/:id", async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "reseña no encontrada" });
    }
    await Report.deleteMany({ targetType: "review", target: review._id });
    await review.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

interface ReportGroup {
  targetType: ReportTarget;
  target: unknown;
  count: number;
  reports: {
    _id: unknown;
    reason: ReportReason;
    details: string | null;
    reporter: string | null;
    createdAt: Date;
  }[];
}

router.get("/reports", async (_req, res, next) => {
  try {
    const reports = await Report.find({ resolved: false })
      .sort({ createdAt: 1 })
      .populate<{ reporter: { username: string } | null }>(
        "reporter",
        "username",
      );
    const idsOf = (type: ReportTarget) =>
      reports.filter((r) => r.targetType === type).map((r) => r.target);
    const [products, comments, targetReviews] = await Promise.all([
      Product.find({ _id: { $in: idsOf("product") } }),
      Comment.find({ _id: { $in: idsOf("comment") } }).populate(
        "product",
        "name",
      ),
      Review.find({ _id: { $in: idsOf("review") } }).populate(
        "reviewedUser",
        "username",
      ),
    ]);
    const targets = new Map<string, unknown>([
      ...products.map((p) => [`product:${p.id}`, p] as const),
      ...comments.map((c) => [`comment:${c.id}`, c] as const),
      ...targetReviews.map((r) => [`review:${r.id}`, r] as const),
    ]);

    const groups = new Map<string, ReportGroup>();
    for (const report of reports) {
      const key = `${report.targetType}:${report.target}`;
      const target = targets.get(key);
      if (!target) {
        continue;
      }
      let group = groups.get(key);
      if (!group) {
        group = {
          targetType: report.targetType,
          target,
          count: 0,
          reports: [],
        };
        groups.set(key, group);
      }
      group.count += 1;
      group.reports.push({
        _id: report._id,
        reason: report.reason,
        details: report.details,
        reporter: report.reporter?.username ?? null,
        createdAt: report.createdAt,
      });
    }
    res.json([...groups.values()].sort((a, b) => b.count - a.count));
  } catch (error) {
    next(error);
  }
});

router.post("/reports/:targetType/:id/dismiss", async (req, res, next) => {
  try {
    const { targetType, id } = req.params;
    if (!REPORT_TARGETS.includes(targetType as ReportTarget)) {
      return res.status(400).json({ error: "tipo de contenido inválido" });
    }
    const result = await Report.updateMany(
      { targetType, target: id, resolved: false },
      { resolved: true },
    );
    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: "no hay reportes pendientes para este contenido" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
