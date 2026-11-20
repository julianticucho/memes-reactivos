# Tests E2E (Playwright)

Pruebas end to end del Marketplace Beauchef: levantan el backend y el
frontend reales y los controlan con un navegador (Chromium).

## Qué se prueba

| Archivo                  | Casos                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/auth.spec.ts`     | Login correcto e incorrecto, sesión que sobrevive a F5, logout, y acceso a rutas protegidas (`/product/new`, `/profile`, `/moderation`) con y sin sesión             |
| `tests/products.spec.ts` | CRUD de productos: listar (y buscar), crear desde el formulario, ver el detalle (y cerrarlo con el botón atrás), editar, eliminar, y que un no-dueño no pueda editar |
| `tests/helper.ts`        | Datos de ejemplo y funciones auxiliares: reiniciar la base, crear usuarios, iniciar sesión, crear productos por API, rellenar el formulario de producto              |

## Base de datos de prueba

Los tests **borran la base de datos** antes de cada caso, así que nunca
corren contra la de desarrollo:

- El backend se levanta con `npm run start:test` (`NODE_ENV=test`), que usa
  `MONGODB_URI_TEST` (por defecto
  `mongodb://127.0.0.1:27017/marketplace-beauchef-test`) en vez de
  `MONGODB_URI`.
- Solo en ese modo existe `POST /api/testing/reset`, que vacía usuarios,
  productos, comentarios y reseñas.

## Requisitos

- Node.js 20 o superior.
- MongoDB corriendo en el puerto 27017. Desde la raíz del repo:
  `docker compose up -d`.
- Dependencias instaladas en `backend/` y `frontend/` (`npm install` en cada
  carpeta).
- El puerto 3001 libre: Playwright levanta su propio backend en modo test, así
  que **detén `npm run dev` del backend** antes de correr los tests.

## Instalación (una vez)

```bash
cd e2etests
npm install
npx playwright install chromium
```

## Correr los tests

```bash
cd e2etests
npm test              # corre todos los tests (sin ventana)
npm run test:headed   # igual, pero mostrando el navegador
npm run test:ui       # modo interactivo de Playwright
npm run test:report   # abre el reporte HTML de la última ejecución
```

`npm test` levanta automáticamente el backend (`npm run start:test` en
`backend/`) y el frontend (`npm run dev` en `frontend/`), y los apaga al
terminar. Si el frontend ya está corriendo en el puerto 5173 se reutiliza.

Para correr un solo archivo o un solo test:

```bash
npx playwright test tests/auth.spec.ts
npx playwright test -g "editar"
```
