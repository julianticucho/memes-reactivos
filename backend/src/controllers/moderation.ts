import express from "express";
import Product from "../models/product.js";
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

export default router;
