import express from "express";
import bcrypt from "bcrypt";
import User, { EMAIL_REGEX } from "../models/user.js";
import Product from "../models/product.js";
import Favorite from "../models/favorite.js";
import { withUser } from "../middleware.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "faltan campos obligatorios" });
    }
    if (password.length < 3) {
      return res
        .status(400)
        .json({ error: "la contraseña debe tener al menos 3 caracteres" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "email inválido" });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ error: "el username ya existe" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "el email ya existe" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Avatar: data URL base64 o null. Es cosmético, no exige la contraseña
// actual. Límite ~500KB de imagen (~700k caracteres base64).
const MAX_AVATAR_LENGTH = 700_000;

router.put("/me/avatar", withUser, async (req, res, next) => {
  try {
    const { avatar } = req.body as { avatar?: unknown };
    if (typeof avatar !== "string" && avatar !== null) {
      return res.status(400).json({ error: "avatar inválido" });
    }
    if (
      typeof avatar === "string" &&
      (!avatar.startsWith("data:image/") || avatar.length > MAX_AVATAR_LENGTH)
    ) {
      return res
        .status(400)
        .json({ error: "imagen inválida o demasiado pesada" });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: "usuario no encontrado" });
    }
    user.avatar = avatar;
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Cambia el email y/o la contraseña del usuario autenticado. Ambos cambios
// exigen verificar la contraseña actual (un secuestrador de sesión no debe
// poder robar la cuenta cambiando el email). El username NO se edita: está
// denormalizado en products.seller y en los comentarios/reseñas.
router.put("/me", withUser, async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body as {
      email?: unknown;
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    if (typeof currentPassword !== "string") {
      return res
        .status(400)
        .json({ error: "se requiere la contraseña actual" });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: "usuario no encontrado" });
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: "contraseña actual incorrecta" });
    }
    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "email inválido" });
      }
      if (email !== user.email && (await User.findOne({ email }))) {
        return res.status(400).json({ error: "el email ya existe" });
      }
      user.email = email;
    }
    if (newPassword !== undefined) {
      if (typeof newPassword !== "string" || newPassword.length < 3) {
        return res
          .status(400)
          .json({ error: "la contraseña debe tener al menos 3 caracteres" });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ---- Favoritos ----
// Viven en su propia coleccion Favorite (ver models/favorite.ts); el
// contador desnormalizado es Product.favoriteCount. Solo se exponen al
// dueño de la cuenta: el perfil publico no los incluye.

// Lista de productos favoritos, del mas reciente al mas antiguo. Se
// descartan los que ya no estan activos (borrados o en moderacion).
router.get("/me/favorites", withUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "usuario no encontrado" });
    }
    const favorites = await Favorite.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    const products = await Product.find({
      _id: { $in: favorites.map((favorite) => favorite.product) },
      status: "active",
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    res.json(
      favorites.flatMap((favorite) => {
        const product = byId.get(favorite.product.toString());
        return product ? [product] : [];
      }),
    );
  } catch (error) {
    next(error);
  }
});

// Marca un producto como favorito. Idempotente: el upsert inserta solo si
// no existia (el indice unico {user, product} respalda la operacion), y el
// contador solo sube cuando hubo insercion.
router.put("/me/favorites/:productId", withUser, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product || product.status !== "active") {
      return res.status(404).json({ error: "producto no encontrado" });
    }
    const result = await Favorite.updateOne(
      { user: req.userId, product: product._id },
      { $setOnInsert: { user: req.userId, product: product._id } },
      { upsert: true },
    );
    if (result.upsertedCount === 1) {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { favoriteCount: 1 } },
      );
    }
    const updated = await Product.findById(product._id).select("favoriteCount");
    res.json({
      favorited: true,
      favoriteCount: updated?.favoriteCount ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

// Desmarca un producto. Tambien idempotente: si no estaba, no toca el
// contador. El filtro favoriteCount > 0 evita dejarlo negativo.
router.delete("/me/favorites/:productId", withUser, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      // El producto ya no existe: limpia la referencia huerfana si quedo.
      await Favorite.deleteOne({
        user: req.userId,
        product: req.params.productId,
      });
      return res.json({ favorited: false, favoriteCount: 0 });
    }
    const result = await Favorite.deleteOne({
      user: req.userId,
      product: product._id,
    });
    if (result.deletedCount === 1) {
      await Product.updateOne(
        { _id: product._id, favoriteCount: { $gt: 0 } },
        { $inc: { favoriteCount: -1 } },
      );
    }
    const updated = await Product.findById(product._id).select("favoriteCount");
    res.json({
      favorited: false,
      favoriteCount: updated?.favoriteCount ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

// Perfil publico: username + contacto. La reputacion vive en
// GET /:id/reviews, que tambien es publico.
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
