import { defineConfig, devices } from "@playwright/test";

// Playwright levanta el backend (en modo test, con su propia base de datos)
// y el frontend antes de correr los tests, y los apaga al terminar.
export default defineConfig({
  testDir: "./tests",
  // Todos los tests comparten la misma base de datos de prueba y la
  // reinician en su beforeEach: deben correr de a uno.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // Nunca se reutiliza un backend ya corriendo: podría ser el de
      // desarrollo (npm run dev), que no expone /api/testing/reset.
      command: "npm run start:test",
      cwd: "../backend",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // El frontend es el mismo en desarrollo y en test: se puede reutilizar.
      command: "npm run dev",
      cwd: "../frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
