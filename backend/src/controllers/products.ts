import express from "express"
import Product from "../models/product.js"
import User from "../models/user.js"
import Comment from "../models/comment.js"
import { withUser } from "../middleware.js"

const router = express.Router()

const validateProductBody = (body: { name?: unknown, description?: unknown, price?: unknown, category?: unknown }): string | null => {
    if (!body.name || !body.description || body.price === undefined || !body.category) {
        return "faltan campos obligatorios"
    }
    return null
}

router.get("/", (_req, res, next) => {
    Product.find({})
        .then((products) => res.json(products))
        .catch((error) => next(error))
})

router.post("/", withUser, async (req, res, next) => {
    try {
        const body = req.body
        const invalid = validateProductBody(body)
        if (invalid) {
            return res.status(400).json({ error: invalid })
        }
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(401).json({ error: "usuario no encontrado" })
        }
        const product = new Product({
            name: body.name,
            description: body.description,
            price: body.price,
            image: body.image || null,
            seller: user.username,
            category: body.category,
            user: user._id,
        })
        const savedProduct = await product.save()
        res.json(savedProduct)
    } catch (error) {
        next(error)
    }
})

router.get("/:id", (req, res, next) => {
    Product.findById(req.params.id)
        .then((product) => {
            if (!product) {
                return res.status(404).json({ error: "producto no encontrado" })
            }
            res.json(product)
        })
        .catch((error) => next(error))
})

router.get("/:id/comments", async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({ error: "producto no encontrado" })
        }
        const comments = await Comment.find({ product: product._id })
            .sort({ createdAt: 1 })
        res.json(comments)
    } catch (error) {
        next(error)
    }
})

router.post("/:id/comments", withUser, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({ error: "producto no encontrado" })
        }
        if (product.user?.toString() === req.userId) {
            return res
                .status(403)
                .json({ error: "no puedes comentar tu propia publicación" })
        }
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(401).json({ error: "usuario no encontrado" })
        }
        const text = req.body.text
        if (!text || typeof text !== "string" || !text.trim()) {
            return res
                .status(400)
                .json({ error: "el texto del comentario es obligatorio" })
        }
        const comment = new Comment({
            text,
            product: product._id,
            user: user._id,
            username: user.username,
        })
        const savedComment = await comment.save()
        res.status(201).json(savedComment)
    } catch (error) {
        next(error)
    }
})

router.put("/:id", withUser, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({ error: "producto no encontrado" })
        }
        if (product.user?.toString() !== req.userId) {
            return res.status(403).json({ error: "no autorizado" })
        }
        const body = req.body
        const invalid = validateProductBody(body)
        if (invalid) {
            return res.status(400).json({ error: invalid })
        }
        product.name = body.name
        product.description = body.description
        product.price = body.price
        product.image = body.image || null
        product.category = body.category
        const updatedProduct = await product.save()
        res.json(updatedProduct)
    } catch (error) {
        next(error)
    }
})

router.delete("/:id", withUser, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({ error: "producto no encontrado" })
        }
        if (product.user?.toString() !== req.userId) {
            return res.status(403).json({ error: "no autorizado" })
        }
        await Comment.deleteMany({ product: product._id })
        await product.deleteOne()
        res.status(204).end()
    } catch (error) {
        next(error)
    }
})

export default router
