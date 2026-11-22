import { test, expect } from "@playwright/test";
import {
  createProductsViaApi,
  createUser,
  expectLoggedIn,
  loginWith,
  otherUser,
  productCard,
  resetDatabase,
  sampleProduct,
  testUser,
} from "./helper";

// Widget de favorito del detalle: etiqueta (estrella + contador) y botón.
const favoriteWidget = (page: import("@playwright/test").Page) =>
  page.locator(".detail-favorite");
const favoriteButton = (page: import("@playwright/test").Page) =>
  favoriteWidget(page).locator(".favorite-button");
const favoriteCount = (page: import("@playwright/test").Page) =>
  favoriteWidget(page).locator(".favorite-count");

const openProductDetail = async (
  page: import("@playwright/test").Page,
  name: string,
) => {
  await page.goto("/");
  await productCard(page, name).click();
  const detail = page.getByRole("dialog", { name, exact: true });
  await detail.waitFor();
  return detail;
};

test.describe("Favoritos", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createProductsViaApi(request, testUser, [sampleProduct]);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);
  });

  test("marcar: el contador sube y el botón queda activo", async ({ page }) => {
    await openProductDetail(page, sampleProduct.name);
    const button = favoriteButton(page);
    await expect(favoriteCount(page)).toContainText("0");

    await button.click();

    // Actualización optimista: el estado cambia sin recargar
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(favoriteCount(page)).toContainText("1");

    // El contador persiste en el backend: sigue tras recargar
    await page.reload();
    const reopened = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await reopened.waitFor();
    await expect(favoriteButton(page)).toHaveAttribute("aria-pressed", "true");
    await expect(favoriteCount(page)).toContainText("1");
    // La tarjeta del catálogo muestra el contador
    await page.goBack();
    await expect(productCard(page, sampleProduct.name)).toContainText("★ 1");
  });

  test("desmarcar: el contador vuelve a 0", async ({ page }) => {
    await openProductDetail(page, sampleProduct.name);
    const button = favoriteButton(page);

    await button.click();
    await expect(favoriteCount(page)).toContainText("1");
    await button.click();

    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(favoriteCount(page)).toContainText("0");

    await page.reload();
    await page
      .getByRole("dialog", { name: sampleProduct.name, exact: true })
      .waitFor();
    await expect(favoriteCount(page)).toContainText("0");
  });

  test("idempotencia: marcar dos veces no duplica el contador", async ({
    page,
  }) => {
    await openProductDetail(page, sampleProduct.name);
    const button = favoriteButton(page);

    await button.click();
    await expect(favoriteCount(page)).toContainText("1");

    // Segundo clic: desmarca (toggle). Vuelve a marcar: el backend solo
    // permite un favorito por (usuario, producto), así que el contador
    // no puede pasar de 1.
    await button.click();
    await expect(favoriteCount(page)).toContainText("0");
    await button.click();
    await expect(favoriteCount(page)).toContainText("1");
    await expect(button).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await page
      .getByRole("dialog", { name: sampleProduct.name, exact: true })
      .waitFor();
    await expect(favoriteCount(page)).toContainText("1");
  });

  test("sin sesión: el botón está deshabilitado", async ({ page }) => {
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/");

    await openProductDetail(page, sampleProduct.name);
    await expect(favoriteButton(page)).toBeDisabled();
    await expect(favoriteCount(page)).toContainText("0");
  });

  test.describe("pestaña Favoritos del perfil", () => {
    test("el perfil propio lista los productos marcados", async ({ page }) => {
      await openProductDetail(page, sampleProduct.name);
      await favoriteButton(page).click();
      await expect(favoriteCount(page)).toContainText("1");
      await page.goBack();

      await page.goto("/profile");
      const tab = page.getByRole("tab", { name: "Favoritos (1)" });
      await tab.click();

      // Ambos paneles quedan montados (uno hidden): acotar al panel activo
      // por su id (Tabs usa aria-controls="tab-favorites").
      const favoritesPanel = page.locator("#tab-favorites:not([hidden])");

      await expect(
        favoritesPanel.locator(".product-card").filter({
          has: page.locator(".product-name", {
            hasText: sampleProduct.name,
          }),
        }),
      ).toBeVisible();
      // El explorador dentro de la pestaña también filtra por búsqueda
      // (el label está en ambos paneles montados: acotar al activo).
      const searchBox = page
        .locator("#tab-favorites:not([hidden])")
        .getByLabel("Búsqueda:");
      await searchBox.fill("texto inexistente");
      await expect(
        page
          .locator("#tab-favorites:not([hidden])")
          .getByText("No se encontraron productos."),
      ).toBeVisible();
      await searchBox.fill("");
      await expect(
        favoritesPanel.locator(".product-card").filter({
          has: page.locator(".product-name", {
            hasText: sampleProduct.name,
          }),
        }),
      ).toBeVisible();
    });

    test("un perfil ajeno no muestra la pestaña Favoritos", async ({
      page,
      request,
    }) => {
      // El propio usuario marca su favorito y ve su pestaña con contador
      await openProductDetail(page, sampleProduct.name);
      await favoriteButton(page).click();
      await page.goBack();
      await page.goto("/profile");
      await expect(
        page.getByRole("tab", { name: "Favoritos (1)" }),
      ).toBeVisible();

      // Otro usuario entra al perfil del dueño vía el enlace del detalle:
      // sin pestaña de favoritos (son privados; el backend solo los expone
      // al dueño de la cuenta)
      await createUser(request, otherUser);
      await page.getByRole("button", { name: "Cerrar sesión" }).click();
      await loginWith(page, otherUser.username, otherUser.password);
      await openProductDetail(page, sampleProduct.name);
      await page
        .getByRole("dialog", { name: sampleProduct.name, exact: true })
        .getByRole("link", { name: testUser.username })
        .click();
      await expect(page.getByRole("tab", { name: /Favoritos/ })).toHaveCount(0);
    });
  });
});
