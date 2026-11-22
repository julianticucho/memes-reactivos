import express from "express";
import bcrypt from "bcrypt";
import Comment from "../models/comment.js";
import Product from "../models/product.js";
import Report from "../models/report.js";
import Review from "../models/review.js";
import User from "../models/user.js";

// Router que solo se monta con NODE_ENV=test (ver index.ts).
const router = express.Router();

router.post("/reset", async (_req, res, next) => {
  try {
    await Promise.all([
      Comment.deleteMany({}),
      Report.deleteMany({}),
      Review.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Crea un usuario con el rol indicado (el registro normal siempre crea
// usuarios "user"): sirve para tener moderadores y admins en los tests.
router.post("/users", async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await new User({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    }).save();
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
