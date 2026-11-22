import { expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export interface TestProduct {
  name: string;
  description: string;
  price: number;
  category: string;
}

export const testUser: TestUser = {
  username: "tester",
  email: "tester@example.com",
  password: "secreto123",
};

export const otherUser: TestUser = {
  username: "otro_tester",
  email: "otro_tester@example.com",
  password: "secreto456",
};

export const thirdUser: TestUser = {
  username: "tercer_tester",
  email: "tercer_tester@example.com",
  password: "secreto789",
};

export const moderatorUser: TestUser = {
  username: "moderador_test",
  email: "moderador_test@example.com",
  password: "moderador123",
};

// Productos de ejemplo. Ningún texto contiene términos moderados, así que
// se publican directo como "active" (visibles en el catálogo).
export const sampleProduct: TestProduct = {
  name: "Calculadora científica",
  description: "Casio fx-570, casi nueva, ideal para Cálculo",
  price: 15000,
  category: "Electrónica",
};

export const otherProducts: TestProduct[] = [
  {
    name: "Polerón Beauchef",
    description: "Talla M, color azul",
    price: 12000,
    category: "Ropa",
  },
  {
    name: "Apuntes de Física",
    description: "Física I completos, anillados",
    price: 3000,
    category: "Libros",
  },
];

// Producto cuyo nombre contiene un término moderado ("cerveza"): al
// publicarse queda "pending" (en revisión) en vez de "active".
export const flaggedProduct: TestProduct = {
  name: "Cerveza artesanal",
  description: "Pack de seis, botella de vidrio",
  price: 8000,
  category: "Otros",
};

// Borra usuarios, productos, comentarios, reseñas y reportes de la base de prueba.
export const resetDatabase = async (request: APIRequestContext) => {
  const response = await request.post("/api/testing/reset");
  if (response.status() !== 204) {
    throw new Error(
      `No se pudo reiniciar la base de datos (${response.status()}). ` +
        "¿El backend corre con NODE_ENV=test (npm run start:test)?",
    );
  }
};

export const createUser = async (
  request: APIRequestContext,
  user: TestUser,
) => {
  const response = await request.post("/api/users", { data: user });
  if (!response.ok()) {
    throw new Error(`No se pudo crear el usuario (${response.status()})`);
  }
};

// Login por la interfaz: abre el formulario, lo rellena y espera a que la
// navbar muestre la sesión iniciada.
export const loginWith = async (
  page: Page,
  username: string,
  password: string,
) => {
  await page.goto("/login");
  await page.getByTestId("username").fill(username);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
};

// Crea productos directo en el backend (sin pasar por la interfaz),
// iniciando sesión con el usuario dado y enviando su token CSRF.
export const createProductsViaApi = async (
  request: APIRequestContext,
  user: TestUser,
  products: TestProduct[],
) => {
  const login = await request.post("/api/login", {
    data: { username: user.username, password: user.password },
  });
  if (!login.ok()) {
    throw new Error(`No se pudo iniciar sesión (${login.status()})`);
  }
  const csrf = login.headers()["x-csrf-token"];
  for (const product of products) {
    const response = await request.post("/api/products", {
      data: product,
      headers: { "X-CSRF-Token": csrf },
    });
    if (!response.ok()) {
      throw new Error(`No se pudo crear el producto (${response.status()})`);
    }
  }
};

// Rellena y envía el formulario de "Publicar producto" (o de edición, que
// es el mismo formulario con los campos precargados).
export const fillProductForm = async (page: Page, product: TestProduct) => {
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Nombre").fill(product.name);
  await dialog.getByPlaceholder("Descripción").fill(product.description);
  await dialog.getByPlaceholder("Precio").fill(String(product.price));
  await dialog.getByRole("combobox").selectOption(product.category);
};

// Tarjeta de un producto en el catálogo, buscada por su nombre exacto.
export const productCard = (page: Page, name: string) =>
  page.locator(".product-card").filter({
    has: page.locator(".product-name", { hasText: name }),
  });

export type StaffRole = "moderator" | "admin";

// Crea un moderador o admin (el registro normal solo crea usuarios "user").
export const createStaff = async (
  request: APIRequestContext,
  user: TestUser,
  role: StaffRole,
) => {
  const response = await request.post("/api/testing/users", {
    data: { ...user, role },
  });
  if (!response.ok()) {
    throw new Error(
      `No se pudo crear el usuario de staff (${response.status()})`,
    );
  }
};

// Inicia sesión por API y devuelve el header CSRF que exigen las
// operaciones que modifican datos.
const apiLogin = async (request: APIRequestContext, user: TestUser) => {
  const response = await request.post("/api/login", {
    data: { username: user.username, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(`No se pudo iniciar sesión (${response.status()})`);
  }
  return { "X-CSRF-Token": response.headers()["x-csrf-token"] };
};

// Id del usuario en la base (lo piden las rutas /profile/:id y /api/users/:id).
export const getUserId = async (
  request: APIRequestContext,
  user: TestUser,
): Promise<string> => {
  const headers = await apiLogin(request, user);
  const response = await request.get("/api/login/me", { headers });
  if (!response.ok()) {
    throw new Error(`No se pudo leer el usuario (${response.status()})`);
  }
  return ((await response.json()) as { id: string }).id;
};

// Crea un producto por API y devuelve su id y su estado ("active" o
// "pending"), que createProductsViaApi no entrega.
export const createProductViaApi = async (
  request: APIRequestContext,
  user: TestUser,
  product: TestProduct,
): Promise<{ _id: string; status: string }> => {
  const headers = await apiLogin(request, user);
  const response = await request.post("/api/products", {
    data: product,
    headers,
  });
  if (!response.ok()) {
    throw new Error(`No se pudo crear el producto (${response.status()})`);
  }
  return (await response.json()) as { _id: string; status: string };
};

export const createCommentViaApi = async (
  request: APIRequestContext,
  author: TestUser,
  productId: string,
  text: string,
) => {
  const headers = await apiLogin(request, author);
  const response = await request.post(`/api/products/${productId}/comments`, {
    data: { text },
    headers,
  });
  if (!response.ok()) {
    throw new Error(`No se pudo crear el comentario (${response.status()})`);
  }
};

export const createReviewViaApi = async (
  request: APIRequestContext,
  author: TestUser,
  reviewedUserId: string,
  vote: 1 | -1,
  text: string | null = null,
) => {
  const headers = await apiLogin(request, author);
  const response = await request.post(`/api/users/${reviewedUserId}/reviews`, {
    data: { vote, text },
    headers,
  });
  if (!response.ok()) {
    throw new Error(`No se pudo crear la reseña (${response.status()})`);
  }
};

// Envía un reporte por API. `path` es la ruta de reporte del contenido,
// por ejemplo `/api/products/<id>/report`.
export const reportViaApi = async (
  request: APIRequestContext,
  reporter: TestUser,
  path: string,
  data: { reason: string; details?: string } = { reason: "scam" },
) => {
  const headers = await apiLogin(request, reporter);
  const response = await request.post(path, { data, headers });
  if (!response.ok()) {
    throw new Error(`No se pudo reportar (${response.status()})`);
  }
};

// Inicia sesión como moderador y entra al panel desde la barra de menú.
export const openModeration = async (page: Page) => {
  await loginWith(page, moderatorUser.username, moderatorUser.password);
  await expectLoggedIn(page, moderatorUser.username);
  await page.getByRole("link", { name: "Moderación" }).click();
  await expect(page).toHaveURL("/moderation");
};

// Ficha de la cola de moderación (producto, comentario, reseña o reporte)
// que contiene el texto dado.
export const moderationItem = (page: Page, text: string) =>
  page.locator("fieldset.moderation-item").filter({ hasText: text });

export const expectLoggedIn = async (page: Page, username: string) => {
  await expect(page.locator(".menu-bar .menu-user")).toHaveText(username);
  await expect(
    page.getByRole("button", { name: "Cerrar sesión" }),
  ).toBeVisible();
};
