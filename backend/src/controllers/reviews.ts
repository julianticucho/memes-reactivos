import express from "express"
import Review from "../models/review.js"
import User from "../models/user.js"
import { withUser } from "../middleware.js"

const router = express.Router()

const isVote = (vote: unknown): vote is 1 | -1 => vote === 1 || vote === -1

// Texto opcional: cadena no vacia de 1 a 500 caracteres (se guarda recortada).
// Devuelve el texto listo para guardar o null si no hay texto.
const normalizeText = (text: unknown): { text?: string, error?: string } => {
    if (text === undefined || text === null || (typeof text === "string" && !text.trim())) {
        return { text: undefined }
    }
    if (typeof text !== "string" || !text.trim() || text.trim().length > 500) {
        return { error: "la reseña debe tener entre 1 y 500 caracteres" }
    }
    return { text: text.trim() }
}

router.get("/:id/reviews", async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ error: "usuario no encontrado" })
        }
        const reviews = await Review.find({ reviewedUser: user._id })
            .sort({ createdAt: -1 })
        let upvotes = 0
        let downvotes = 0
        for (const review of reviews) {
            if (review.vote === 1) {
                upvotes += 1
            } else {
                downvotes += 1
            }
        }
        res.json({
            reviews,
            stats: {
                upvotes,
                downvotes,
                score: upvotes - downvotes,
                count: reviews.length,
            },
        })
    } catch (error) {
        next(error)
    }
})

router.post("/:id/reviews", withUser, async (req, res, next) => {
    try {
        const reviewedUser = await User.findById(req.params.id)
        if (!reviewedUser) {
            return res.status(404).json({ error: "usuario no encontrado" })
        }
        if (reviewedUser.id === req.userId) {
            return res
                .status(403)
                .json({ error: "no puedes reseñar tu propio perfil" })
        }
        const author = await User.findById(req.userId)
        if (!author) {
            return res.status(401).json({ error: "usuario no encontrado" })
        }
        const { vote } = req.body
        if (!isVote(vote)) {
            return res.status(400).json({ error: "el voto debe ser 1 o -1" })
        }
        const body = normalizeText(req.body.text)
        if (body.error) {
            return res.status(400).json({ error: body.error })
        }
        const existing = await Review.findOne({
            user: author._id,
            reviewedUser: reviewedUser._id,
        })
        if (existing) {
            return res
                .status(400)
                .json({ error: "ya dejaste una reseña para este usuario" })
        }
        const review = new Review({
            text: body.text ?? null,
            vote,
            reviewedUser: reviewedUser._id,
            user: author._id,
            username: author.username,
        })
        const savedReview = await review.save()
        res.status(201).json(savedReview)
    } catch (error) {
        next(error)
    }
})

router.put("/:id/reviews", withUser, async (req, res, next) => {
    try {
        const review = await Review.findOne({
            user: req.userId,
            reviewedUser: req.params.id,
        })
        if (!review) {
            return res
                .status(404)
                .json({ error: "no dejaste una reseña para este usuario" })
        }
        const { vote } = req.body
        if (!isVote(vote)) {
            return res.status(400).json({ error: "el voto debe ser 1 o -1" })
        }
        const body = normalizeText(req.body.text)
        if (body.error) {
            return res.status(400).json({ error: body.error })
        }
        review.text = body.text ?? null
        review.vote = vote
        const updatedReview = await review.save()
        res.json(updatedReview)
    } catch (error) {
        next(error)
    }
})

router.delete("/:id/reviews", withUser, async (req, res, next) => {
    try {
        const review = await Review.findOne({
            user: req.userId,
            reviewedUser: req.params.id,
        })
        if (!review) {
            return res
                .status(404)
                .json({ error: "no dejaste una reseña para este usuario" })
        }
        await review.deleteOne()
        res.status(204).end()
    } catch (error) {
        next(error)
    }
})

export default router
