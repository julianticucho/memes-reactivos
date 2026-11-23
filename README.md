# Marketplace Beauchef

Marketplace con frontend en React (Vite) y backend en Express + MongoDB.

## Estructura del repo

```
.
├── backend/        # API Express + TypeScript
├── frontend/       # React + Vite
├── e2etests/       # Tests end-to-end con Playwright
├── compose.yaml    # MongoDB vía Docker (puerto 27017)
└── make-deploy.sh  # Genera el tarball desplegable
```

## Correr local

1. Levantar MongoDB (requiere Docker o Podman):

   ```bash
   docker compose up -d
   ```

2. Instalar dependencias en cada carpeta:

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. Correr el backend (puerto 3001):

   ```bash
   npm run dev --prefix backend
   ```

4. En otra terminal, correr el frontend (Vite, puerto 5173):

   ```bash
   npm run dev --prefix frontend
   ```

Opcional: poblar la base con datos de ejemplo con `npm run seed <n° seeds> --prefix backend`.

## Tests

Los tests E2E levantan su propio backend en modo test (`NODE_ENV=test`, DB separada `marketplace-beauchef-test`).

```bash
cd e2etests && npm install && npx playwright install chromium

# correr todos los tests
npm test
```

## Deploy

`make-deploy.sh` genera un tarball con los archivos del deploy (`marketplace-beauchef.tar`) con el backend y frontend compilados dentro de build y dist respectivamente, ademas de las dependencias de producción y un `.env` con las variables necesarias y un `JWT_SECRET` aleatorio.

```bash
MONGODB_URI="mongodb://..." MONGODB_DBNAME="marketplace" PORT=3001 ./make-deploy.sh
```

En el servidor:

```bash
tar -xf marketplace-beauchef.tar
cd marketplace-beauchef
npm start
# o utilizar pm2 para gestionar el proceso
pm2 start npm --name <nombre-proceso> -- run start
```

De esta forma se ejecuta un solo proceso que sirve tanto el backend como el frontend compilado.
