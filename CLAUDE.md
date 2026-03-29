# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server on http://localhost:5173
npm run build     # tsc + vite build
npm run lint      # eslint
npm run preview   # preview production build
```

## Environment

Create a `.env` file at the root if you need to point to a specific backend:

```
VITE_API_URL=http://localhost:3333/api
```

Without it, the Vite dev server proxies `/api` to `http://localhost:3333` automatically (configured in `vite.config.ts`).

## Architecture

This is an admin panel + public shop for a fish market (MM Pescados), built with React 19, TypeScript, and React Router 7. No state management library — state lives in component `useState`.

### Routing (`src/App.tsx`)
Two parallel route trees depending on auth state:
- `/loja` — public shop, always accessible (`src/pages/shop/Shop.tsx`)
- `/login` — login page, redirects to `/dashboard` if already authenticated
- `/*` — protected dashboard routes, redirects to `/login` if not authenticated

Auth state is bootstrapped from `localStorage` via `storageService.isAuthenticated()` and the JWT token is stored under the key `mm-auth-token`.

### API layer (`src/services/api.ts`)
Thin `fetch` wrapper with methods: `get`, `post`, `patch`, `put`, `delete`, `postFormData`, `patchFormData`.

- All methods read the Bearer token from `localStorage` via `getAuthHeaders()`.
- `postFormData` / `patchFormData` do **not** set `Content-Type` — the browser sets it with the multipart boundary automatically.
- Base URL defaults to `/api` (proxied by Vite) or `VITE_API_URL`.

### Dashboard pages (`src/pages/admin/`)
Each page is a self-contained component that calls `api` directly — no shared data layer. Pages already migrated to the API: `Products`, `Orders`. Pages still using `localStorage` via `storageService`: `Clients`, `Users`, `DashboardHome`, `Reports`, `Stock`.

### Product form (`src/pages/admin/Products.tsx`)
Submission uses `multipart/form-data` with two keys:
- `product` — JSON string of all product fields (parse with `JSON.parse(req.body.product)` on the backend)
- `image` — the image `File` object, only appended when the user selects a new file

### Auth service (`src/services/storage.service.ts`)
Handles all `localStorage` persistence. `storageService` is still used by pages not yet integrated with the API, and also for auth state (token, user info).

### Styles
Global CSS in `src/assets/styles/`. No CSS framework — custom utility classes like `.button`, `.card`, `.modal`, `.table`, `.status-badge`, etc., defined in the CSS files.
