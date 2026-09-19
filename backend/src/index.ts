import 'dotenv/config'
import express from "express"
import cors from "cors"
import Product from "./models/product.js"

const app = express()
app.use(express.json())
app.use(cors())

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" })
})

app.get("/api/products", (_req, res, next) => {
    Product.find({})
        .then((products) => res.json(products))
        .catch((error) => next(error))
})

app.post("/api/products", (req, res, next) => {
    const body = req.body
    if (!body.name || !body.description || body.price === undefined || !body.seller || !body.category) {
        return res.status(400).json({ error: "faltan campos obligatorios" })
    }
    const product = new Product({
        name: body.name,
        description: body.description,
        price: body.price,
        image: body.image || null,
        seller: body.seller,
        category: body.category,
    })
    product.save()
        .then((savedProduct) => res.json(savedProduct))
        .catch((error) => next(error))
})

app.get("/api/products/:id", (req, res, next) => {
    Product.findById(req.params.id)
        .then((product) => {
            if (!product) {
                return res.status(404).json({ error: "producto no encontrado" })
            }
            res.json(product)
        })
        .catch((error) => next(error))
})

const unknownEndpoint = (_req: express.Request, res: express.Response) => {
    res.status(404).send({ error: "unknown endpoint" })
}
app.use(unknownEndpoint)

const errorHandler = (
    error: { name: string, message: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
) => {
    console.error(error.message)
    if (error.name === "CastError") {
        res.status(400).send({ error: "id inválido" })
    } else if (error.name === "ValidationError") {
        res.status(400).send({ error: error.message })
    }
}
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
