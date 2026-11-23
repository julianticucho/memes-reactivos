// npm run seed -- [numero de usuarios a crear]
// npm run seed -- 5

import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./models/user.js";
import Product from "./models/product.js";
import Comment from "./models/comment.js";
import Review from "./models/review.js";
import Favorite from "./models/favorite.js";
import Report from "./models/report.js";

const STAFF = [
  { username: "admin", role: "admin" },
  { username: "moderador", role: "moderator" },
] as const;

const PRODUCTS_PER_USER = 8;
const IMAGES_PER_PRODUCT = 3;

// https://http.cat/<code>
const HTTP_CODES = [
  100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300,
  301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407,
  408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424,
  425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 506, 507, 508, 510,
  511,
];

const CATEGORIES = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Otros",
];

const DESCRIPTION = "descripcion ".repeat(40).trim();

const randomFrom = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const fetchCatImage = async (code: number): Promise<string | null> => {
  try {
    const response = await fetch(`https://http.cat/${code}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
};

const pickRandomCodes = (count: number): number[] => {
  const pool = [...HTTP_CODES];
  const picked: number[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
};

// ---- Datos de interacciones (comentarios, reseñas, favoritos) ----
// No se siembra moderación: ningún texto usa términos de moderation.ts, así
// que todo queda "active", y no se crean reportes.

const COMMENTS_PER_PRODUCT = { min: 0, max: 4 };
const FAVORITES_PER_USER = { min: 3, max: 8 };
const REVIEWS_PER_USER = 3;

const COMMENT_TEXTS = [
  "¿Sigue disponible?",
  "¿Haces entrega en Beauchef 850?",
  "¿Aceptas transferencia?",
  "¿Lo dejas en un poco menos?",
  "¿Qué tan usado está?",
  "Me interesa, ¿cuándo podríamos juntarnos?",
  "¿Tiene algún detalle o daño?",
  "¿Puedo pasar a verlo mañana después de clases?",
  "Se lo compré a este vendedor antes, todo perfecto",
  "¿Tienes más fotos?",
  "¿Viene con caja?",
  "Excelente precio",
];

const REVIEW_TEXTS_UP: Array<string | null> = [
  "Muy buena onda, entregó a la hora acordada.",
  "Todo tal cual la descripción. Recomendado.",
  "Respondió rápido y el producto llegó impecable.",
  null,
];

const REVIEW_TEXTS_DOWN: Array<string | null> = [
  "No llegó a la hora acordada.",
  "El producto tenía detalles que no mencionó.",
  null,
];

const randomInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

const shuffled = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Fecha "hace N minutos": los documentos sembrados quedan escalonados en el
// tiempo, asi los listados ordenados por fecha se ven naturales.
const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60_000);

interface SeedUser {
  _id: mongoose.Types.ObjectId;
  username: string;
}

interface SeedProduct {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | null;
}

const isSame = (
  a: mongoose.Types.ObjectId,
  b: mongoose.Types.ObjectId | null,
): boolean => b !== null && a.equals(b);

const seedInteractions = async (
  users: SeedUser[],
  staff: SeedUser[],
  products: SeedProduct[],
) => {
  // Cualquiera puede comentar y marcar favoritos, salvo en sus propios
  // productos (el backend tampoco deja comentar lo propio).
  const everyone = [...users, ...staff];

  // Comentarios: algunos por producto, escalonados de a un minuto.
  let minute = products.length * COMMENTS_PER_PRODUCT.max + 10;
  const comments = products.flatMap((product) => {
    const authors = everyone.filter((u) => !isSame(u._id, product.user));
    if (authors.length === 0) return [];
    const count = randomInt(COMMENTS_PER_PRODUCT.min, COMMENTS_PER_PRODUCT.max);
    return Array.from({ length: count }, () => {
      const author = randomFrom(authors);
      const date = minutesAgo(minute--);
      return {
        text: randomFrom(COMMENT_TEXTS),
        product: product._id,
        user: author._id,
        username: author.username,
        createdAt: date,
        updatedAt: date,
      };
    });
  });
  await Comment.insertMany(comments);

  // Favoritos: cada usuario marca algunos productos ajenos; el contador
  // desnormalizado Product.favoriteCount se calcula a partir de ellos.
  const favorites = everyone.flatMap((user) => {
    const candidates = products.filter((p) => !isSame(user._id, p.user));
    const count = Math.min(
      candidates.length,
      randomInt(FAVORITES_PER_USER.min, FAVORITES_PER_USER.max),
    );
    return shuffled(candidates)
      .slice(0, count)
      .map((product) => ({
        user: user._id,
        product: product._id,
        createdAt: minutesAgo(randomInt(1, 600)),
      }));
  });
  await Favorite.insertMany(favorites);
  const favoriteCounts = new Map<string, number>();
  for (const favorite of favorites) {
    const key = favorite.product.toString();
    favoriteCounts.set(key, (favoriteCounts.get(key) ?? 0) + 1);
  }
  if (favoriteCounts.size > 0) {
    await Product.bulkWrite(
      [...favoriteCounts].map(([id, favoriteCount]) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { favoriteCount } },
        },
      })),
    );
  }

  // Reseñas: cada usuario reseña a algunos usuarios normales (una por par,
  // como exige el indice unico). Mayoria positivas.
  const reviews = everyone.flatMap((author) => {
    const targets = shuffled(
      users.filter((u) => !u._id.equals(author._id)),
    ).slice(0, REVIEWS_PER_USER);
    return targets.map((target) => {
      const vote: 1 | -1 = Math.random() < 0.75 ? 1 : -1;
      const date = minutesAgo(randomInt(1, 2000));
      return {
        text: randomFrom(vote === 1 ? REVIEW_TEXTS_UP : REVIEW_TEXTS_DOWN),
        vote,
        reviewedUser: target._id,
        user: author._id,
        username: author.username,
        createdAt: date,
        updatedAt: date,
      };
    });
  });
  await Review.insertMany(reviews);

  console.log(`  comentarios: ${comments.length}`);
  console.log(`  reseñas: ${reviews.length}`);
  console.log(`  favoritos: ${favorites.length}`);
};

const main = async () => {
  const arg = process.argv[2];
  let userCount = 2;
  if (arg !== undefined) {
    const parsed = Number(arg);
    if (!Number.isInteger(parsed) || parsed < 1) {
      console.error(
        "Uso: npm run seed -- [cantidad-de-usuarios] (entero >= 1)",
      );
      process.exit(1);
    }
    userCount = parsed;
  }

  await mongoose.connection.asPromise();

  console.log(
    "reseteando usuarios, productos, comentarios, reseñas, favoritos y reportes...",
  );
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Comment.deleteMany({}),
    Review.deleteMany({}),
    Favorite.deleteMany({}),
    Report.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("123", 10);

  const staff: SeedUser[] = [];
  for (const { username, role } of STAFF) {
    const staffUser = await new User({
      username,
      email: `${username}@gmail.com`,
      passwordHash,
      role,
    }).save();
    staff.push(staffUser);
    console.log(`  ${username}: rol ${role}`);
  }

  const users: SeedUser[] = [];
  const allProducts: SeedProduct[] = [];
  let productNumber = 1;
  for (let i = 1; i <= userCount; i++) {
    const user = await new User({
      username: `usuario_${i}`,
      email: `usuario_${i}@gmail.com`,
      passwordHash,
    }).save();
    users.push(user);

    const products = await Promise.all(
      Array.from({ length: PRODUCTS_PER_USER }, async () => {
        const name = `producto_${productNumber++}`;
        const images = (
          await Promise.all(
            pickRandomCodes(IMAGES_PER_PRODUCT).map(fetchCatImage),
          )
        ).filter((image): image is string => image !== null);
        return {
          name,
          description: DESCRIPTION,
          price: 1000 + Math.floor(Math.random() * 99000),
          image: images.length > 0 ? images : null,
          seller: user.username,
          category: randomFrom(CATEGORIES),
          user: user._id,
        };
      }),
    );
    const inserted = await Product.insertMany(products);
    allProducts.push(...inserted);
    console.log(
      `  usuario_${i}: productos ${products[0].name} … ${products[PRODUCTS_PER_USER - 1].name}`,
    );
  }

  await seedInteractions(users, staff, allProducts);

  console.log(`Seed listo: ${userCount} usuario(s), contraseña "123"`);
  console.log(
    `Productos: producto_1 … producto_${userCount * PRODUCTS_PER_USER}`,
  );
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  console.error("Error en el seed:", error);
  process.exit(1);
});
