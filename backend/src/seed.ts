// npm run seed -- [numero de usuarios a crear]
// npm run seed -- 5

import "dotenv/config"
import bcrypt from "bcrypt"
import mongoose from "mongoose"
import User from "./models/user.js"
import Product from "./models/product.js"

const PRODUCTS_PER_USER = 8

// https://http.cat/<code> 
const HTTP_CODES = [
    100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 305, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
    414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
    500, 501, 502, 503, 504, 506, 507, 508, 510, 511,
]

const CATEGORIES = [
    "Electrónica",
    "Ropa",
    "Hogar",
    "Deportes",
    "Libros",
    "Otros",
]

const DESCRIPTION = "descripcion ".repeat(40).trim()

const randomFrom = <T>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)]

const fetchCatImage = async (code: number): Promise<string | null> => {
    try {
        const response = await fetch(`https://http.cat/${code}`, {
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) return null
        const buffer = Buffer.from(await response.arrayBuffer())
        return `data:image/jpeg;base64,${buffer.toString("base64")}`
    } catch {
        return null
    }
}

const main = async () => {
    const arg = process.argv[2]
    let userCount = 2
    if (arg !== undefined) {
        const parsed = Number(arg)
        if (!Number.isInteger(parsed) || parsed < 1) {
            console.error("Uso: npm run seed -- [cantidad-de-usuarios] (entero >= 1)")
            process.exit(1)
        }
        userCount = parsed
    }

    await mongoose.connection.asPromise()

    console.log("reseteando usuarios y productos...")
    await User.deleteMany({})
    await Product.deleteMany({})

    const passwordHash = await bcrypt.hash("123", 10)

    let productNumber = 1
    for (let i = 1; i <= userCount; i++) {
        const user = await new User({
            username: `usuario_${i}`,
            email: `usuario_${i}@gmail.com`,
            passwordHash,
        }).save()

        const products = await Promise.all(
            Array.from({ length: PRODUCTS_PER_USER }, async () => {
                const name = `producto_${productNumber++}`
                const image = await fetchCatImage(randomFrom(HTTP_CODES))
                return {
                    name,
                    description: DESCRIPTION,
                    price: 1000 + Math.floor(Math.random() * 99000),
                    image: image ? [image] : null,
                    seller: user.username,
                    category: randomFrom(CATEGORIES),
                    user: user._id,
                }
            }),
        )
        await Product.insertMany(products)
        console.log(`  usuario_${i}: productos ${products[0].name} … ${products[PRODUCTS_PER_USER - 1].name}`)
    }

    console.log(`Seed listo: ${userCount} usuario(s), contraseña "123"`)
    console.log(`Productos: producto_1 … producto_${userCount * PRODUCTS_PER_USER}`)
    await mongoose.disconnect()
    process.exit(0)
}

main().catch((error) => {
    console.error("Error en el seed:", error)
    process.exit(1)
})
