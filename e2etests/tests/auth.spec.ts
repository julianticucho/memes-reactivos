import { test, expect } from "@playwright/test";
import {
  createUser,
  expectLoggedIn,
  loginWith,
  resetDatabase,
  testUser,
} from "./helper";

test.describe("Login", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await page.goto("/");
  });

  test("inicia sesión con credenciales correctas", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);

    await expect(page).toHaveURL("/");
    await expectLoggedIn(page, testUser.username);
    await expect(page.locator(".status-bar")).toContainText(
      `Conectado como ${testUser.username}`,
    );
  });

  test("no inicia sesión con una contraseña incorrecta", async ({ page }) => {
    await loginWith(page, testUser.username, "contraseña-incorrecta");

    await expect(page.locator(".error")).toHaveText(
      "usuario o contraseña inválidos",
    );
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("link", { name: "Iniciar sesión" }),
    ).toBeVisible();
  });

  test("no inicia sesión con un usuario que no existe", async ({ page }) => {
    await loginWith(page, "no_existe", "da-lo-mismo");

    await expect(page.locator(".error")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("la sesión se mantiene al recargar la página", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.reload();
    await expectLoggedIn(page, testUser.username);
  });

  test("un usuario puede cerrar sesión", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();

    await expect(
      page.getByRole("link", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cerrar sesión" }),
    ).not.toBeVisible();
    await expect(page.locator(".status-bar")).toContainText(
      "No has iniciado sesión",
    );
  });
});

test.describe("Acceso a rutas protegidas", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
  });

  for (const path of ["/product/new", "/profile"]) {
    test(`sin sesión, ${path} redirige a /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL("/login");
      await expect(page.getByTestId("username")).toBeVisible();
    });
  }

  test("sin rol de staff, /moderation redirige al inicio", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.goto("/moderation");
    await expect(page).toHaveURL("/");
  });

  test("con sesión, se puede entrar a /product/new y sobrevive a F5", async ({
    page,
  }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.goto("/product/new");
    const dialog = page.getByRole("dialog", { name: "Publicar producto" });
    await expect(dialog).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL("/product/new");
    await expect(dialog).toBeVisible();
  });
});
