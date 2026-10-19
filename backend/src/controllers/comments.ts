import express from "express";
import Comment from "../models/comment.js";
import { withUser } from "../middleware.js";

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
    const updatedComment = await comment.save();
    res.json(updatedComment);
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
    await comment.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
