#!/usr/bin/env bash

# Genera marketplace-beauchef.tar: un tarball desplegable y autocontenido.
# Estructura final (la raíz del tarball ES el backend):
#
#   marketplace-beauchef/
#   ├── package.json      (scripts.start = node build/index.js)
#   ├── .env              (generado, con JWT_SECRET aleatorio)
#   ├── build/            (backend compilado con tsc)
#   ├── dist/             (frontend compilado con Vite → backend/dist)
#   └── node_modules/     (solo dependencias de producción)
#
# En el servidor: extraer y correr `npm start` en la carpeta extraída.
# El backend sirve dist/ (el frontend) y escucha en PORT (default 3001).
#
# Uso (todas las variables son requeridas):
#   MONGODB_URI="mongodb://..." MONGODB_DBNAME="marketplace" PORT=3001 ./make-deploy.sh
#
# Opcional: TARBALL para cambiar el nombre del archivo de salida.

set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI es requerido (ej: mongodb://localhost:27017)}"
: "${MONGODB_DBNAME:?MONGODB_DBNAME es requerido (ej: marketplace-beauchef)}"
: "${PORT:?PORT es requerido (ej: 3001)}"
TARBALL="${TARBALL:-marketplace-beauchef.tar}"

STAGE="$(mktemp -d)"
STAGE_DIR="$STAGE/marketplace-beauchef"
trap 'rm -rf "$STAGE"' EXIT

echo "==> Compilando backend + frontend (npm run build)..."
npm run build

echo "==> Armando el paquete en $STAGE_DIR..."
mkdir -p "$STAGE_DIR"

# Backend compilado, package.json y .gitignore
cp -r backend/build "$STAGE_DIR/build"
cp backend/package.json "$STAGE_DIR/package.json"
cp backend/package-lock.json "$STAGE_DIR/package-lock.json" 2>/dev/null || true

# Frontend compilado (vite ya lo deja en backend/dist)
cp -r backend/dist "$STAGE_DIR/dist"

# Solo dependencias de producción (sin devDependencies: tsc, tsx, etc.)
echo "==> Instalando dependencias de producción..."
(cd "$STAGE_DIR" && npm ci --omit=dev --no-audit --no-fund)

# .env generado (el backend lo lee con dotenv desde el cwd)
JWT_SECRET="$(head -c 32 /dev/urandom | base64)"
cat > "$STAGE_DIR/.env" <<EOF
MONGODB_URI=${MONGODB_URI}
MONGODB_DBNAME=${MONGODB_DBNAME}
PORT=${PORT}
HOST=0.0.0.0
JWT_SECRET=${JWT_SECRET}
EOF
chmod 600 "$STAGE_DIR/.env"

echo "==> Empaquetando $TARBALL..."
tar -cf "$TARBALL" -C "$STAGE" marketplace-beauchef

echo "Listo: $TARBALL"
echo "Desplegar: tar -xf $TARBALL && cd marketplace-beauchef && npm start"
