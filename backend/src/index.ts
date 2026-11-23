import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import productsRouter from "./controllers/products.js";
import moderationRouter from "./controllers/moderation.js";
import usersRouter from "./controllers/users.js";
import loginRouter from "./controllers/login.js";
import commentsRouter from "./controllers/comments.js";
import "./models/favorite.js";
import reviewsRouter from "./controllers/reviews.js";
import testingRouter from "./controllers/testing.js";
import middleware from "./middleware.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", reviewsRouter);

// Solo para los tests E2E: permite reiniciar la base de datos de prueba.
if (process.env.NODE_ENV === "test") {
  app.use("/api/testing", testingRouter);
}

const unknownEndpoint = (_req: express.Request, res: express.Response) => {
  res.status(404).send({ error: "unknown endpoint" });
};

// En producción se sirve el frontend compilado (dist/) desde el backend.
if (process.env.NODE_ENV !== "test") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(__dirname, "../dist");

  app.use(express.static(distDir));
  // SPA fallback: cualquier ruta que no sea de la API devuelve index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use(unknownEndpoint);

app.use(middleware.errorHandler);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
