import path from "path";
import { test, expect } from "@playwright/test";
import {
  createUser,
  expectLoggedIn,
  loginWith,
  otherUser,
  resetDatabase,
  testUser,
} from "./helper";

const avatarFixture = path.join(__dirname, "fixtures", "avatar.png");

const openEditProfile = async (page: import("@playwright/test").Page) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Editar perfil" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar perfil" });
  await dialog.waitFor();
  return dialog;
};

test.describe("Editar perfil", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request);
    await createUser(request, testUser);
    await loginWith(page, testUser.username, testUser.password);
    await expectLoggedIn(page, testUser.username);
    await openEditProfile(page);
  });

  test("cambiar la foto de perfil", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Editar perfil" });
    await dialog.locator('input[type="file"]').setInputFiles(avatarFixture);
    await dialog.getByRole("button", { name: "Guardar foto" }).click();

    await expect(page.getByRole("status")).toContainText("Foto actualizada");

    // El modal vive en la URL: sobrevive a F5 y lo cierra el botón atrás
    await page.reload();
    await expect(
      page.getByRole("dialog", { name: "Editar perfil" }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL("/profile");
    await expect(
      page.getByRole("dialog", { name: "Editar perfil" }),
    ).not.toBeVisible();

    // Reabrimos para verificar la foto guardada en el header
    await page.getByRole("button", { name: "Editar perfil" }).click();
    await expect(
      page.getByRole("dialog", { name: "Editar perfil" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/profile");
    const header = page.locator(".profile-header img");
    await expect(header).toHaveAttribute("src", /data:image\/png;base64,/);

    // Persistió en el backend: sigue tras recargar
    await page.reload();
    await expect(header).toHaveAttribute("src", /data:image\/png;base64,/);
  });

  test("cambiar el email", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Editar perfil" });
    const emailSection = dialog.locator("fieldset", { hasText: "Email" });
    await emailSection.getByPlaceholder("Email").fill("nuevo@example.com");
    await emailSection
      .getByPlaceholder("Contraseña actual")
      .fill(testUser.password);
    await emailSection.getByRole("button", { name: "Cambiar email" }).click();

    await expect(page.getByRole("status")).toContainText("Email actualizado");

    await page.keyboard.press("Escape");
    await expect(page.locator(".profile-info")).toContainText(
      "nuevo@example.com",
    );

    // Persistió en el backend
    await page.reload();
    await expect(page.locator(".profile-info")).toContainText(
      "nuevo@example.com",
    );
  });

  test("no cambia el email si la contraseña actual es incorrecta", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", { name: "Editar perfil" });
    const emailSection = dialog.locator("fieldset", { hasText: "Email" });
    await emailSection.getByPlaceholder("Email").fill("nuevo@example.com");
    await emailSection
      .getByPlaceholder("Contraseña actual")
      .fill("contraseña-mala");
    await emailSection.getByRole("button", { name: "Cambiar email" }).click();

    await expect(
      emailSection.getByText("contraseña actual incorrecta"),
    ).toBeVisible();
    await expect(dialog).toBeVisible();

    // El email no cambió
    await page.keyboard.press("Escape");
    await expect(page.locator(".profile-info")).toContainText(testUser.email);
  });

  test("rechaza un email ya registrado", async ({ page, request }) => {
    await createUser(request, otherUser);

    const dialog = page.getByRole("dialog", { name: "Editar perfil" });
    const emailSection = dialog.locator("fieldset", { hasText: "Email" });
    await emailSection.getByPlaceholder("Email").fill(otherUser.email);
    await emailSection
      .getByPlaceholder("Contraseña actual")
      .fill(testUser.password);
    await emailSection.getByRole("button", { name: "Cambiar email" }).click();

    await expect(emailSection.getByText("el email ya existe")).toBeVisible();
  });

  test("cambiar la contraseña y volver a entrar", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Editar perfil" });
    const passwordSection = dialog.locator("fieldset", {
      hasText: "Contraseña",
    });
    await passwordSection
      .getByPlaceholder("Contraseña actual")
      .fill(testUser.password);
    await passwordSection
      .getByPlaceholder("Nueva contraseña", { exact: true })
      .fill("nueva-clave-456");
    await passwordSection
      .getByPlaceholder("Confirmar nueva contraseña")
      .fill("nueva-clave-456");
    await passwordSection
      .getByRole("button", { name: "Cambiar contraseña" })
      .click();

    await expect(page.getByRole("status")).toContainText(
      "Contraseña actualizada",
    );

    await page.keyboard.press("Escape");

    // La contraseña antigua ya no sirve
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await loginWith(page, testUser.username, testUser.password);
    await expect(page.locator(".error")).toContainText(
      "usuario o contraseña inválidos",
    );

    // La nueva sí
    await page.getByTestId("password").fill("nueva-clave-456");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expectLoggedIn(page, testUser.username);
  });
});

test.describe("Ruta protegida /profile con modal de edición", () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test("sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/profile?edit=perfil");
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("username")).toBeVisible();
  });
});
