import express from "express";
import Comment from "../models/comment.js";
import Product from "../models/product.js";
import Review from "../models/review.js";
import User from "../models/user.js";

// Router que solo se monta con NODE_ENV=test (ver index.ts).
const router = express.Router();

router.post("/reset", async (_req, res, next) => {
  try {
    await Promise.all([
      Comment.deleteMany({}),
      Review.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
