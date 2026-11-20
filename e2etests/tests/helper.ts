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

// Borra usuarios, productos, comentarios y reseñas de la base de prueba.
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

export const expectLoggedIn = async (page: Page, username: string) => {
  await expect(page.locator(".menu-bar .menu-user")).toHaveText(username);
  await expect(
    page.getByRole("button", { name: "Cerrar sesión" }),
  ).toBeVisible();
};
