# AGENTS.md

## Layout

Two independent packages. No monorepo tooling, no root scripts. `hitos/` is
gitignored (milestone deliverables, not source).

```
backend/   Express 5 + Mongoose + MongoDB (ESM, tsx)
frontend/  React 19 + Vite 7 + xp.css (Windows XP theme)
```

- UI = XP.css + inline styles. `@emotion/*` is in frontend deps but **unused** in
  `src/` — don't assume a component library exists.
- No README, no CI, no test framework in either package.

## Dev Commands

Run each package from its own directory:

```bash
# Backend — no eslint config here (`npm run lint` exits 2); the build IS the typecheck
cd backend && npm run dev     # tsx watch on :3001
cd backend && npm run build   # tsc → build/

# Frontend
cd frontend && npm run dev    # Vite dev server (proxies /api → localhost:3001)
cd frontend && npm run build  # tsc -b && vite build
cd frontend && npm run lint   # eslint .
cd frontend && npx tsc -b     # typecheck only (project references)
```

Verify changes with: backend `npm run build` · frontend `npx tsc -b && npm run lint`.

```bash
cd backend && npm run seed        # seed demo data — DESTRUCTIVE: drops ALL users+products
cd backend && npm run seed -- 5   # N users usuario_1..N (password "123"), 8 products each
```

No combined "start all" script. Start both terminals manually.

## Prerequisites

- MongoDB on port 27017. `backend/.env` (gitignored) sets `MONGODB_URI`/`PORT`/`JWT_SECRET`.
- **DB name trap**: `.env.example` and the code fallback use `marketplace-beauchef`,
  but the current local `.env` uses `marketplace-beauchef-demo-1` (where the seed
  data lives). Check `.env` before assuming which DB you touch.
- `src/models/product.ts` runs `mongoose.connect()` at import time.

## Backend Gotchas

- **ESM throughout** — `"type": "module"`, NodeNext; local imports need the
  `.js` suffix even for `.ts` files (`import Foo from "./foo.js"`).
- **`import "dotenv/config"` must be the first import** of every entrypoint
  (`index.ts`, `seed.ts`) — models read `process.env` at import time.
- **Strict TS** — `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`
  (`noUnusedParameters: false`).
- **Express 5** — rejected promises from handlers flow to the error middleware;
  `errorHandler` maps CastError/ValidationError/E11000/TokenExpiredError to 4xx.
- **Auth** — JWT in httpOnly cookie `token`, carrying a `csrf` uuid that must be
  echoed in the `X-CSRF-Token` header (stored in frontend localStorage). Mutating
  endpoints require `withUser` (`src/middleware.ts`) + ownership check
  (`product.user?.toString() === req.userId`). Passwords: bcrypt cost 10.
- **Seed fetches https://http.cat** (needs internet) and stores images as base64.

## Frontend Gotchas

- **`verbatimModuleSyntax: true`** — type-only imports must use `import type`.
- **`erasableSyntaxOnly: true`** — no enums, no parameter properties.
- **ESLint** — self-closing tags enforced; `no-console` = warn;
  `react-hooks/exhaustive-deps` = off.
- **CSS layers** — `@layer theme, base, xp, components, utilities`; XP.css sits in
  `xp`. Custom styles go in `@layer components` (in `src/index.css`) or they lose
  to / break XP.css overrides.
- **Auth calls** — `utils/axiosSecure.ts` for authenticated requests (attaches
  CSRF header + credentials); plain `axios` for public GETs. `user` and `setToast`
  live in `App.tsx` and flow down as props.
- **UX convention** — successes → XP toast via `setToast`; form field errors →
  inline `<p>`.
- **No file uploads** — `Product.image` is `string[] | null` of base64 data URLs.
- **Vite proxy** — `/api` → `http://localhost:3001`; backend must be running.

## Testing

No test framework is configured in either package. There are no tests to run.
