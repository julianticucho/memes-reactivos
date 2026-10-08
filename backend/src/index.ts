import 'dotenv/config'
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import productsRouter from "./controllers/products.js"
import usersRouter from "./controllers/users.js"
import loginRouter from "./controllers/login.js"
import middleware from "./middleware.js"

declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: true, credentials: true }))

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" })
})

app.use("/api/products", productsRouter)
app.use("/api/users", usersRouter)
app.use("/api/login", loginRouter)

const unknownEndpoint = (_req: express.Request, res: express.Response) => {
    res.status(404).send({ error: "unknown endpoint" })
}
app.use(unknownEndpoint)

app.use(middleware.errorHandler)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
