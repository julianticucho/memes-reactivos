import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user.js"
import { withUser } from "../middleware.js"

const JWT_SECRET = process.env.JWT_SECRET || "my_secret"

const router = express.Router()

router.post("/", async (req, res, next) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ error: "usuario o contraseña inválidos" })
        }
        const passwordCorrect = await bcrypt.compare(password, user.passwordHash)
        if (!passwordCorrect) {
            return res
                .status(401)
                .json({ error: "usuario o contraseña inválidos" })
        }
        const userForToken = {
            id: user.id,
            username: user.username,
            csrf: crypto.randomUUID(),
        }
        const token = jwt.sign(userForToken, JWT_SECRET, { expiresIn: 60 * 60 })
        res.setHeader("X-CSRF-Token", userForToken.csrf)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        })
        res.status(200).send({ username: user.username })
    } catch (error) {
        next(error)
    }
})

router.get("/me", withUser, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(401).json({ error: "usuario no encontrado" })
        }
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
})

router.post("/logout", (_req, res) => {
    res.clearCookie("token")
    res.status(200).json({ message: "sesión cerrada" })
})

export default router
