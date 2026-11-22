import express from "express";
import Review from "../models/review.js";
import Report from "../models/report.js";
import User from "../models/user.js";
import { withOptionalUser, withUser } from "../middleware.js";
import { moderationStatus } from "../moderation.js";
import { fileReport } from "../reports.js";

const router = express.Router();

const isVote = (vote: unknown): vote is 1 | -1 => vote === 1 || vote === -1;

// Texto opcional: cadena no vacia de 1 a 500 caracteres (se guarda recortada).
// Devuelve el texto listo para guardar o null si no hay texto.
const normalizeText = (text: unknown): { text?: string; error?: string } => {
  if (
    text === undefined ||
    text === null ||
    (typeof text === "string" && !text.trim())
  ) {
    return { text: undefined };
  }
  if (typeof text !== "string" || !text.trim() || text.trim().length > 500) {
    return { error: "la reseña debe tener entre 1 y 500 caracteres" };
  }
  return { text: text.trim() };
};

router.get("/:id/reviews", withOptionalUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "usuario no encontrado" });
    }
    const visible = req.userId
      ? { $or: [{ status: "active" }, { user: req.userId }] }
      : { status: "active" };
    const reviews = await Review.find({
      reviewedUser: user._id,
      ...visible,
    }).sort({ createdAt: -1 });
    let upvotes = 0;
    let downvotes = 0;
    for (const review of reviews) {
      if (review.status === "pending") {
        continue;
      }
      if (review.vote === 1) {
        upvotes += 1;
      } else {
        downvotes += 1;
      }
    }
    res.json({
      reviews,
      stats: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        count: upvotes + downvotes,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reviews", withUser, async (req, res, next) => {
  try {
    const reviewedUser = await User.findById(req.params.id);
    if (!reviewedUser) {
      return res.status(404).json({ error: "usuario no encontrado" });
    }
    if (reviewedUser.id === req.userId) {
      return res
        .status(403)
        .json({ error: "no puedes reseñar tu propio perfil" });
    }
    const author = await User.findById(req.userId);
    if (!author) {
      return res.status(401).json({ error: "usuario no encontrado" });
    }
    const { vote } = req.body;
    if (!isVote(vote)) {
      return res.status(400).json({ error: "el voto debe ser 1 o -1" });
    }
    const body = normalizeText(req.body.text);
    if (body.error) {
      return res.status(400).json({ error: body.error });
    }
    const existing = await Review.findOne({
      user: author._id,
      reviewedUser: reviewedUser._id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "ya dejaste una reseña para este usuario" });
    }
    const review = new Review({
      text: body.text ?? null,
      vote,
      reviewedUser: reviewedUser._id,
      user: author._id,
      username: author.username,
      status: moderationStatus(body.text ?? ""),
    });
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    next(error);
  }
});

router.put("/:id/reviews", withUser, async (req, res, next) => {
  try {
    const review = await Review.findOne({
      user: req.userId,
      reviewedUser: req.params.id,
    });
    if (!review) {
      return res
        .status(404)
        .json({ error: "no dejaste una reseña para este usuario" });
    }
    const { vote } = req.body;
    if (!isVote(vote)) {
      return res.status(400).json({ error: "el voto debe ser 1 o -1" });
    }
    const body = normalizeText(req.body.text);
    if (body.error) {
      return res.status(400).json({ error: body.error });
    }
    review.text = body.text ?? null;
    review.vote = vote;
    review.status = moderationStatus(body.text ?? "");
    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/reviews/:reviewId/report",
  withUser,
  async (req, res, next) => {
    try {
      const review = await Review.findOne({
        _id: req.params.reviewId,
        reviewedUser: req.params.id,
      });
      if (!review || review.status === "pending") {
        return res.status(404).json({ error: "reseña no encontrada" });
      }
      if (review.user.toString() === req.userId) {
        return res
          .status(403)
          .json({ error: "no puedes reportar tu propia reseña" });
      }
      if (!review.text) {
        return res
          .status(400)
          .json({ error: "las reseñas sin texto no se pueden reportar" });
      }
      const result = await fileReport(
        "review",
        review._id,
        req.userId,
        req.body,
      );
      if ("error" in result) {
        return res.status(400).json({ error: result.error });
      }
      res.status(201).json(result.report);
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/:id/reviews", withUser, async (req, res, next) => {
  try {
    const review = await Review.findOne({
      user: req.userId,
      reviewedUser: req.params.id,
    });
    if (!review) {
      return res
        .status(404)
        .json({ error: "no dejaste una reseña para este usuario" });
    }
    await Report.deleteMany({ targetType: "review", target: review._id });
    await review.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
