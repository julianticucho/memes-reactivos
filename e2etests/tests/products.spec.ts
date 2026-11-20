import { test, expect } from "@playwright/test";
import {
  createProductsViaApi,
  createUser,
  expectLoggedIn,
  fillProductForm,
  loginWith,
  otherProducts,
  otherUser,
  productCard,
  resetDatabase,
  sampleProduct,
  testUser,
} from "./helper";
import type { TestProduct } from "./helper";

test.describe("CRUD de productos", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
  });

  test("listar: el catálogo muestra los productos publicados", async ({
    page,
    request,
  }) => {
    await createProductsViaApi(request, testUser, otherProducts);
    await page.goto("/");

    for (const product of otherProducts) {
      const card = productCard(page, product.name);
      await expect(card).toBeVisible();
      await expect(card).toContainText(`$${product.price}`);
      await expect(card).toContainText(testUser.username);
    }

    // La búsqueda filtra el catálogo por nombre
    await page.getByLabel("Búsqueda:").fill(otherProducts[0].name);
    await expect(productCard(page, otherProducts[0].name)).toBeVisible();
    await expect(productCard(page, otherProducts[1].name)).toHaveCount(0);
  });

  test("crear: un usuario con sesión publica un producto", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.getByRole("link", { name: "Publicar" }).click();
    await expect(page).toHaveURL("/product/new");

    await fillProductForm(page, sampleProduct);
    await page
      .getByRole("dialog", { name: "Publicar producto" })
      .getByRole("button", { name: "Publicar" })
      .click();

    await expect(page.getByRole("status")).toContainText("Producto publicado");
    await expect(page).toHaveURL("/");
    await expect(productCard(page, sampleProduct.name)).toBeVisible();

    // Quedó guardado en el backend: sigue ahí después de recargar
    await page.reload();
    await expect(productCard(page, sampleProduct.name)).toBeVisible();
  });

  test.describe("con un producto ya publicado", () => {
    test.beforeEach(async ({ page, request }) => {
      await createProductsViaApi(request, testUser, [sampleProduct]);
      await loginWith(page, testUser.username, testUser.password);
      await expectLoggedIn(page, testUser.username);
    });

    test("ver: al abrir la tarjeta se muestra el detalle", async ({ page }) => {
      await productCard(page, sampleProduct.name).click();

      await expect(page).toHaveURL(/\?product=/);
      const detail = page.getByRole("dialog", {
        name: sampleProduct.name,
        exact: true,
      });
      await expect(detail).toContainText(`$${sampleProduct.price}`);
      await expect(detail).toContainText(sampleProduct.description);
      await expect(detail).toContainText(sampleProduct.category);

      // El detalle vive en la URL: el botón atrás lo cierra
      await page.goBack();
      await expect(detail).not.toBeVisible();
      await expect(page).toHaveURL("/");
    });

    test("editar: el dueño modifica su producto", async ({ page }) => {
      const updated: TestProduct = {
        name: "Calculadora graficadora",
        description: "TI-84 Plus, con funda",
        price: 45000,
        category: "Otros",
      };

      await productCard(page, sampleProduct.name).click();
      await page
        .getByRole("dialog", { name: sampleProduct.name, exact: true })
        .getByRole("button", { name: "Editar" })
        .click();

      await expect(page).toHaveURL(/\/product\/.+\/edit$/);
      const form = page.getByRole("dialog", { name: "Editar producto" });
      // El formulario viene precargado con los datos actuales
      await expect(form.getByPlaceholder("Nombre")).toHaveValue(
        sampleProduct.name,
      );

      await fillProductForm(page, updated);
      await form.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(page.getByRole("status")).toContainText(
        "Producto actualizado",
      );
      const detail = page.getByRole("dialog", {
        name: updated.name,
        exact: true,
      });
      await expect(detail).toContainText(`$${updated.price}`);
      await expect(detail).toContainText(updated.description);

      await page.reload();
      await expect(productCard(page, updated.name)).toBeVisible();
      await expect(productCard(page, sampleProduct.name)).toHaveCount(0);
    });

    test("eliminar: el dueño borra su producto", async ({ page }) => {
      await productCard(page, sampleProduct.name).click();
      await page
        .getByRole("dialog", { name: sampleProduct.name, exact: true })
        .getByRole("button", { name: "Eliminar" })
        .click();

      await page
        .getByRole("dialog", { name: "Confirmar eliminación" })
        .getByRole("button", { name: "Eliminar" })
        .click();

      await expect(page.getByRole("status")).toContainText(
        "Producto eliminado",
      );
      await expect(productCard(page, sampleProduct.name)).toHaveCount(0);

      await page.reload();
      await expect(
        page.getByText("No se encontraron productos."),
      ).toBeVisible();
    });
  });

  test("un usuario que no es el dueño no puede editar ni eliminar", async ({
    page,
    request,
  }) => {
    await createUser(request, otherUser);
    await createProductsViaApi(request, otherUser, [sampleProduct]);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await productCard(page, sampleProduct.name).click();
    const detail = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await expect(detail).toContainText(otherUser.username);
    await expect(detail.getByRole("button", { name: "Editar" })).toHaveCount(0);
    await expect(detail.getByRole("button", { name: "Eliminar" })).toHaveCount(
      0,
    );
  });
});
