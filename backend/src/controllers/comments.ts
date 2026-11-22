import express from "express";
import Comment from "../models/comment.js";
import Report from "../models/report.js";
import { withUser } from "../middleware.js";
import { moderationStatus } from "../moderation.js";
import { fileReport } from "../reports.js";

const router = express.Router();

router.put("/:id", withUser, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "comentario no encontrado" });
    }
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({ error: "no autorizado" });
    }
    const text = req.body.text;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res
        .status(400)
        .json({ error: "el texto del comentario es obligatorio" });
    }
    comment.text = text;
    comment.status = moderationStatus(text);
    const updatedComment = await comment.save();
    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/report", withUser, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.status === "pending") {
      return res.status(404).json({ error: "comentario no encontrado" });
    }
    if (comment.user.toString() === req.userId) {
      return res
        .status(403)
        .json({ error: "no puedes reportar tu propio comentario" });
    }
    const result = await fileReport(
      "comment",
      comment._id,
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
});

router.delete("/:id", withUser, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "comentario no encontrado" });
    }
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({ error: "no autorizado" });
    }
    await Report.deleteMany({ targetType: "comment", target: comment._id });
    await comment.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
