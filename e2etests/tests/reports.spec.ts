import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  createCommentViaApi,
  createProductViaApi,
  createReviewViaApi,
  createStaff,
  createUser,
  expectLoggedIn,
  getUserId,
  loginWith,
  moderationItem,
  moderatorUser,
  openModeration,
  otherUser,
  productCard,
  reportViaApi,
  resetDatabase,
  sampleProduct,
  testUser,
  thirdUser,
} from "./helper";

// Contenido sin términos moderados: se publica directo como "active".
const commentText = "¿Todavía está disponible?";
const reviewText = "Muy buena atención, todo tal cual";

// Rellena y envía el diálogo "Reportar ..." que esté abierto.
const submitReport = async (
  page: Page,
  dialogName: string,
  reason: string,
  details?: string,
) => {
  const dialog = page.getByRole("dialog", { name: dialogName });
  await dialog.getByRole("combobox").selectOption({ label: reason });
  if (details) {
    await dialog.getByPlaceholder("Detalles (opcional)").fill(details);
  }
  await dialog.getByRole("button", { name: "Enviar reporte" }).click();
};

test.describe("Reportar contenido", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createUser(request, otherUser);
    await createUser(request, thirdUser);
  });

  test("reportar un producto ajeno lo deja visible", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, otherUser, sampleProduct);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await productCard(page, sampleProduct.name).click();
    await page
      .getByRole("dialog", { name: sampleProduct.name, exact: true })
      .getByRole("button", { name: "Reportar" })
      .click();
    await submitReport(
      page,
      "Reportar publicación",
      "Estafa o spam",
      "Parece una estafa",
    );

    await expect(page.getByRole("status")).toContainText(
      "tu reporte fue enviado",
    );
    await expect(
      page.getByRole("dialog", { name: "Reportar publicación" }),
    ).not.toBeVisible();

    // Reportar no oculta nada: el producto sigue en el catálogo
    await page.goto("/");
    await expect(productCard(page, sampleProduct.name)).toBeVisible();
  });

  test("el reporte exige elegir un motivo", async ({ page, request }) => {
    await createProductViaApi(request, otherUser, sampleProduct);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await productCard(page, sampleProduct.name).click();
    await page
      .getByRole("dialog", { name: sampleProduct.name, exact: true })
      .getByRole("button", { name: "Reportar" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Reportar publicación" });
    await dialog.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(dialog.getByText("Elige un motivo")).toBeVisible();
  });

  test("no se puede reportar dos veces el mismo contenido", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, otherUser, sampleProduct);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await productCard(page, sampleProduct.name).click();
    const detail = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await detail.getByRole("button", { name: "Reportar" }).click();
    await submitReport(page, "Reportar publicación", "Otro");
    await expect(page.getByRole("status")).toContainText(
      "tu reporte fue enviado",
    );

    await detail.getByRole("button", { name: "Reportar" }).click();
    await submitReport(page, "Reportar publicación", "Otro");
    await expect(page.getByRole("status")).toContainText(
      "ya reportaste este contenido",
    );
  });

  test("el dueño no puede reportar su propio producto", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, otherUser, sampleProduct);
    await loginWith(page, otherUser.username, otherUser.password);
    await expectLoggedIn(page, otherUser.username);

    await productCard(page, sampleProduct.name).click();
    const detail = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("button", { name: "Reportar" })).toHaveCount(
      0,
    );
  });

  test("sin sesión no aparece el botón de reportar", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, otherUser, sampleProduct);
    await page.goto("/");

    await productCard(page, sampleProduct.name).click();
    const detail = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("button", { name: "Reportar" })).toHaveCount(
      0,
    );
  });

  test("reportar un comentario ajeno", async ({ page, request }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    await createCommentViaApi(request, thirdUser, product._id, commentText);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await productCard(page, sampleProduct.name).click();
    const detail = page.getByRole("dialog", {
      name: sampleProduct.name,
      exact: true,
    });
    await detail.getByRole("tab", { name: /Comentarios/ }).click();
    await detail
      .locator(".comment-list")
      .getByRole("button", {
        name: "Reportar",
      })
      .click();
    await submitReport(page, "Reportar comentario", "Contenido ofensivo");

    await expect(page.getByRole("status")).toContainText(
      "tu reporte fue enviado",
    );
  });

  test("quien recibe una reseña con texto puede reportarla, pero no las que solo tienen voto", async ({
    page,
    request,
  }) => {
    const reviewedId = await getUserId(request, otherUser);
    await createReviewViaApi(request, thirdUser, reviewedId, -1, reviewText);
    await createReviewViaApi(request, testUser, reviewedId, 1);

    await loginWith(page, otherUser.username, otherUser.password);
    await expectLoggedIn(page, otherUser.username);
    await page.goto("/profile");
    await page.getByRole("tab", { name: /Reseñas/ }).click();

    // Hay dos reseñas, pero solo la que tiene texto se puede reportar
    await expect(page.locator(".review-list li")).toHaveCount(2);
    const reportButtons = page.getByRole("button", { name: "Reportar" });
    await expect(reportButtons).toHaveCount(1);

    await reportButtons.click();
    await submitReport(page, "Reportar reseña", "Contenido ofensivo");
    await expect(page.getByRole("status")).toContainText(
      "tu reporte fue enviado",
    );
  });
});

test.describe("Reportes en el panel de moderación", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createUser(request, otherUser);
    await createUser(request, thirdUser);
    await createStaff(request, moderatorUser, "moderator");
  });

  test("el moderador ve los reportes agrupados y los descarta", async ({
    page,
    request,
  }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    const path = `/api/products/${product._id}/report`;
    await reportViaApi(request, testUser, path, {
      reason: "scam",
      details: "Parece una estafa",
    });
    await reportViaApi(request, thirdUser, path, { reason: "illegal" });

    await openModeration(page);
    await page.getByRole("tab", { name: "Reportes (1)" }).click();

    const item = moderationItem(page, sampleProduct.name);
    await expect(item).toContainText("2 reportes");
    await expect(item).toContainText("Estafa o spam");
    await expect(item).toContainText("Parece una estafa");
    await expect(item).toContainText("Contenido ilegal o prohibido");
    await expect(item).toContainText(testUser.username);
    await expect(item).toContainText(thirdUser.username);

    await item.getByRole("button", { name: "Descartar reportes" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Reportes descartados",
    );
    await expect(page.getByRole("tab", { name: "Reportes (0)" })).toBeVisible();
    await expect(
      page.getByText("No hay reportes pendientes de revisión"),
    ).toBeVisible();

    // Descartar no toca el contenido
    await page.goto("/");
    await expect(productCard(page, sampleProduct.name)).toBeVisible();
  });

  test("el moderador elimina un producto reportado", async ({
    page,
    request,
  }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    await reportViaApi(
      request,
      testUser,
      `/api/products/${product._id}/report`,
    );

    await openModeration(page);
    await page.getByRole("tab", { name: /Reportes/ }).click();
    const item = moderationItem(page, sampleProduct.name);
    await item.getByRole("button", { name: "Eliminar contenido" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar eliminación" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText("Contenido eliminado");
    await expect(item).toHaveCount(0);

    await page.goto("/");
    await expect(page.getByText("No se encontraron productos.")).toBeVisible();
  });

  test("el moderador elimina un comentario reportado", async ({
    page,
    request,
  }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    await createCommentViaApi(request, thirdUser, product._id, commentText);
    const comments = (await (
      await request.get(`/api/products/${product._id}/comments`)
    ).json()) as { _id: string }[];
    await reportViaApi(
      request,
      testUser,
      `/api/comments/${comments[0]._id}/report`,
    );

    await openModeration(page);
    await page.getByRole("tab", { name: /Reportes/ }).click();
    const item = moderationItem(page, commentText);
    await expect(item).toContainText(sampleProduct.name);
    await item.getByRole("button", { name: "Eliminar contenido" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar eliminación" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText("Contenido eliminado");
    await expect(item).toHaveCount(0);

    const after = await request.get(`/api/products/${product._id}/comments`);
    expect(await after.json()).toHaveLength(0);
  });

  test("el moderador elimina una reseña reportada", async ({
    page,
    request,
  }) => {
    const reviewedId = await getUserId(request, otherUser);
    await createReviewViaApi(request, thirdUser, reviewedId, -1, reviewText);
    const { reviews } = (await (
      await request.get(`/api/users/${reviewedId}/reviews`)
    ).json()) as { reviews: { _id: string }[] };
    await reportViaApi(
      request,
      testUser,
      `/api/users/${reviewedId}/reviews/${reviews[0]._id}/report`,
    );

    await openModeration(page);
    await page.getByRole("tab", { name: /Reportes/ }).click();
    const item = moderationItem(page, reviewText);
    await expect(item).toContainText(otherUser.username);
    await item.getByRole("button", { name: "Eliminar contenido" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar eliminación" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText("Contenido eliminado");
    await expect(item).toHaveCount(0);
  });
});
