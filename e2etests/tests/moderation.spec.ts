import { test, expect } from "@playwright/test";
import {
  createCommentViaApi,
  createProductViaApi,
  createReviewViaApi,
  createStaff,
  createUser,
  expectLoggedIn,
  fillProductForm,
  flaggedProduct,
  getUserId,
  loginWith,
  moderationItem,
  moderatorUser,
  openModeration,
  otherUser,
  productCard,
  resetDatabase,
  sampleProduct,
  testUser,
} from "./helper";

// Textos con un término moderado ("cerveza"): quedan pendientes de revisión.
const flaggedComment = "¿Todavía tienes cerveza?";
const flaggedReview = "Vendía cerveza sin avisar";

test.describe("Moderación de productos", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createUser(request, otherUser);
    await createStaff(request, moderatorUser, "moderator");
  });

  test("publicar con palabras moderadas deja el producto en revisión", async ({
    page,
  }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.getByRole("link", { name: "Publicar" }).click();
    await fillProductForm(page, flaggedProduct);
    await page
      .getByRole("dialog", { name: "Publicar producto" })
      .getByRole("button", { name: "Publicar" })
      .click();

    await expect(page.getByRole("status")).toContainText(
      "está siendo revisada",
    );
    // El dueño lo ve en su perfil, marcado como "En revisión"
    await expect(page).toHaveURL("/profile");
    const card = productCard(page, flaggedProduct.name);
    await expect(card).toBeVisible();
    await expect(card).toContainText("En revisión");

    // Pero no aparece en el catálogo público
    await page.goto("/");
    await expect(page.getByText("No se encontraron productos.")).toBeVisible();
    await expect(productCard(page, flaggedProduct.name)).toHaveCount(0);
  });

  test("un producto en revisión no es visible para otros usuarios", async ({
    page,
    request,
  }) => {
    const pending = await createProductViaApi(
      request,
      otherUser,
      flaggedProduct,
    );
    expect(pending.status).toBe("pending");

    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.goto(`/?product=${pending._id}`);
    await expect(
      page.getByRole("dialog", { name: "Detalle de producto" }),
    ).toContainText("Producto no encontrado");
  });

  test("el enlace Moderación solo aparece para el staff", async ({ page }) => {
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);
    await expect(page.getByRole("link", { name: "Moderación" })).toHaveCount(0);
  });

  test("el moderador aprueba un producto y pasa al catálogo", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, testUser, flaggedProduct);
    await openModeration(page);

    const item = moderationItem(page, flaggedProduct.name);
    await expect(item).toBeVisible();
    await item.getByRole("button", { name: "Aprobar" }).click();

    await expect(page.getByRole("status")).toContainText("aprobado");
    await expect(item).toHaveCount(0);

    await page.goto("/");
    await expect(productCard(page, flaggedProduct.name)).toBeVisible();
  });

  test("el moderador elimina un producto en revisión", async ({
    page,
    request,
  }) => {
    await createProductViaApi(request, testUser, flaggedProduct);
    await openModeration(page);

    const item = moderationItem(page, flaggedProduct.name);
    await item.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText("eliminado");
    await expect(item).toHaveCount(0);

    await page.goto("/");
    await expect(page.getByText("No se encontraron productos.")).toBeVisible();
  });
});

test.describe("Moderación de comentarios", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createUser(request, otherUser);
    await createStaff(request, moderatorUser, "moderator");
  });

  test("un comentario con palabras moderadas queda en revisión", async ({
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
    await detail.getByRole("tab", { name: /Comentarios/ }).click();
    await detail
      .getByPlaceholder("Escribe tu pregunta o comentario...")
      .fill(flaggedComment);
    await detail.getByRole("button", { name: "Comentar" }).click();

    await expect(page.getByRole("status")).toContainText(
      "está siendo revisado",
    );
    // Su autor lo ve con la etiqueta, pero no cuenta como comentario público
    const list = detail.locator(".comment-list");
    await expect(list).toContainText(flaggedComment);
    await expect(list).toContainText("En revisión");
    await expect(
      detail.getByRole("tab", { name: "Comentarios (0)" }),
    ).toBeVisible();
  });

  test("el moderador aprueba un comentario pendiente", async ({
    page,
    request,
  }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    await createCommentViaApi(request, testUser, product._id, flaggedComment);
    await openModeration(page);

    await page.getByRole("tab", { name: /Comentarios/ }).click();
    const item = moderationItem(page, flaggedComment);
    await expect(item).toContainText(sampleProduct.name);
    await item.getByRole("button", { name: "Aprobar" }).click();

    await expect(page.getByRole("status")).toContainText("Comentario aprobado");
    await expect(item).toHaveCount(0);

    const response = await request.get(`/api/products/${product._id}/comments`);
    const comments = (await response.json()) as { status: string }[];
    expect(comments).toHaveLength(1);
    expect(comments[0].status).toBe("active");
  });

  test("el moderador elimina un comentario pendiente", async ({
    page,
    request,
  }) => {
    const product = await createProductViaApi(
      request,
      otherUser,
      sampleProduct,
    );
    await createCommentViaApi(request, testUser, product._id, flaggedComment);
    await openModeration(page);

    await page.getByRole("tab", { name: /Comentarios/ }).click();
    const item = moderationItem(page, flaggedComment);
    await item.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar eliminación" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText(
      "Comentario eliminado",
    );
    await expect(item).toHaveCount(0);

    const response = await request.get(`/api/products/${product._id}/comments`);
    expect(await response.json()).toHaveLength(0);
  });
});

test.describe("Moderación de reseñas", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await createUser(request, otherUser);
    await createStaff(request, moderatorUser, "moderator");
  });

  test("una reseña con palabras moderadas queda en revisión", async ({
    page,
    request,
  }) => {
    const reviewedId = await getUserId(request, otherUser);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);

    await page.goto(`/profile/${reviewedId}`);
    await page.getByRole("tab", { name: /Reseñas/ }).click();
    // XP.css oculta el radio real (opacity: 0) y dibuja el suyo en la
    // etiqueta, así que se hace clic en la etiqueta, como un usuario.
    await page.getByText("+1 Buena experiencia").click();
    await expect(page.getByLabel("+1 Buena experiencia")).toBeChecked();
    await page
      .getByPlaceholder("Cuenta cómo fue tu experiencia (opcional)...")
      .fill(flaggedReview);
    await page.getByRole("button", { name: "Publicar reseña" }).click();

    await expect(page.getByRole("status")).toContainText(
      "está siendo revisada",
    );
    await expect(page.locator(".review-list")).toContainText("En revisión");
    // No suma a la reputación hasta que se apruebe
    await expect(page.locator(".reputation-summary")).toContainText(
      "a favor: 0",
    );
  });

  test("el moderador aprueba una reseña y suma a la reputación", async ({
    page,
    request,
  }) => {
    const reviewedId = await getUserId(request, otherUser);
    await createReviewViaApi(request, testUser, reviewedId, 1, flaggedReview);
    await openModeration(page);

    await page.getByRole("tab", { name: /Reseñas/ }).click();
    const item = moderationItem(page, flaggedReview);
    await expect(item).toContainText(otherUser.username);
    await item.getByRole("button", { name: "Aprobar" }).click();

    await expect(page.getByRole("status")).toContainText("Reseña aprobada");
    await expect(item).toHaveCount(0);

    const response = await request.get(`/api/users/${reviewedId}/reviews`);
    const body = (await response.json()) as { stats: { count: number } };
    expect(body.stats.count).toBe(1);
  });

  test("el moderador elimina una reseña pendiente", async ({
    page,
    request,
  }) => {
    const reviewedId = await getUserId(request, otherUser);
    await createReviewViaApi(request, testUser, reviewedId, -1, flaggedReview);
    await openModeration(page);

    await page.getByRole("tab", { name: /Reseñas/ }).click();
    const item = moderationItem(page, flaggedReview);
    await item.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar eliminación" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(page.getByRole("status")).toContainText("Reseña eliminada");
    await expect(item).toHaveCount(0);
  });
});
