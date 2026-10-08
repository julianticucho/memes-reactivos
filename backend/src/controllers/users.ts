import express from "express"
import bcrypt from "bcrypt"
import User, { EMAIL_REGEX } from "../models/user.js"

const router = express.Router()

router.post("/", async (req, res, next) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ error: "faltan campos obligatorios" })
        }
        if (password.length < 3) {
            return res
                .status(400)
                .json({ error: "la contraseña debe tener al menos 3 caracteres" })
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "email inválido" })
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: "el username ya existe" })
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ error: "el email ya existe" })
        }
        const passwordHash = await bcrypt.hash(password, 10)
        const user = new User({ username, email, passwordHash })
        const savedUser = await user.save()
        res.status(201).json(savedUser)
    } catch (error) {
        next(error)
    }
})

router.get("/", async (_req, res, next) => {
    try {
        const users = await User.find({})
        res.json(users)
    } catch (error) {
        next(error)
    }
})

export default router
