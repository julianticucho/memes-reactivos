import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "my_secret"

export const withUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const token = req.cookies?.token
        if (!token) {
            res.status(401).json({ error: "token faltante" })
            return
        }
        const decodedToken = jwt.verify(token, JWT_SECRET)
        const csrfToken = req.headers["x-csrf-token"]
        if (
            typeof decodedToken === "object"
            && decodedToken.id
            && decodedToken.csrf === csrfToken
        ) {
            req.userId = decodedToken.id
            next()
        } else {
            res.status(401).json({ error: "token inválido" })
        }
    } catch (error) {
        if (error instanceof Error && error.name === "TokenExpiredError") {
            next(error)
            return
        }
        res.status(401).json({ error: "token inválido" })
    }
}

const errorHandler = (
    error: { name: string, message: string },
    _req: Request,
    res: Response,
    next: NextFunction,
) => {
    console.error(error.message)
    if (error.name === "CastError") {
        res.status(400).send({ error: "id inválido" })
    } else if (error.name === "ValidationError") {
        res.status(400).send({ error: error.message })
    } else if (
        error.name === "MongoServerError"
        && error.message.includes("E11000 duplicate key error")
    ) {
        const field = error.message.includes("email") ? "email" : "username"
        res.status(400).json({ error: `el ${field} ya existe` })
    } else if (error.name === "TokenExpiredError") {
        res.status(401).json({ error: "token expirado" })
    } else {
        next(error)
    }
}

export default { errorHandler }
