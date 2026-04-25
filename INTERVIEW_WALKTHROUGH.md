# Interview walkthrough — how the app is built (step by step)

Use this as a **talk track**: follow the order below and open each file in your editor as you explain it.

## 1) Big picture (30 seconds)

- **Browser** loads the React app (Vite). It calls **`/tasks`** on the same origin in production, or the **Vite dev proxy** forwards `/tasks` to the Express server in development.
- **Express** implements REST CRUD and reads/writes **SQLite** via `better-sqlite3`.
- **Zod** validates query strings and JSON bodies on the server. The **client** also uses **Zod** for the “new task” form so obvious mistakes never hit the network.
- **URL state (nuqs)**: list filters and the “new task” draft live in the **query string** (e.g. `?fStatus=todo&newTitle=...`) so a **reload** or **shared link** keeps the same UI.

```text
[ React + nuqs (URL) ]  --fetch-->  [ Express /tasks ]  --SQL-->  [ SQLite file ]
```

---

## 2) Backend (read these files in order)

| Step | File | What to say |
| ---- | ---- | ----------- |
| B1 | [`server/src/index.ts`](server/src/index.ts) | **Entry point**: creates the app, picks `PORT` (default `3001`), and calls `getDb()` once so the database file is opened and the schema is created. |
| B2 | [`server/src/app.ts`](server/src/app.ts) | **Express app factory**: `cors`, `express.json`, mounts **`/tasks`**, and in **`NODE_ENV=production`** serves the built Vite app from `client/dist` so one process serves UI + API. |
| B3 | [`server/src/middleware/apiKey.ts`](server/src/middleware/apiKey.ts) | **Optional auth**: if `API_KEY` is set in the environment, every `/tasks` request must send **`X-API-Key`** or the response is **401** with JSON `error`. |
| B4 | [`server/src/db.ts`](server/src/db.ts) | **SQLite**: path from `DATABASE_PATH` or `server/data/tasks.db`, **`CREATE TABLE IF NOT EXISTS tasks`**, and a lazy `getDb()` so tests can use `DATABASE_PATH=:memory:` before the first use. |
| B5 | [`server/src/validation.ts`](server/src/validation.ts) | **Zod schemas** for: GET query (`status`, `priority`), POST body (full task), PATCH body (partial, at least one field). |
| B6 | [`server/src/types.ts`](server/src/types.ts) | **Row → API mapping**: database columns use `snake_case` (`created_at`); JSON uses **`createdAt`**. |
| B7 | [`server/src/routes/tasks.ts`](server/src/routes/tasks.ts) | **Routes**: `GET` builds dynamic `WHERE` for filters, `POST` inserts with a new id + ISO timestamp, `PATCH` / `DELETE` return **404** if missing, **400** for bad Zod, **201** on create, **204** on delete. |
| B8 | [`server/src/tasks.test.ts`](server/src/tasks.test.ts) + [`server/src/set-test-env.ts`](server/src/set-test-env.ts) | **Tests**: set `DATABASE_PATH=:memory:` first, then call **`GET /tasks`** and **`POST` + filtered `GET`** with supertest. |

---

## 3) Frontend (read these files in order)

| Step | File | What to say |
| ---- | ---- | ----------- |
| F1 | [`client/index.html`](client/index.html) | Single `#root` div; Vite injects the JS bundle. |
| F2 | [`client/vite.config.ts`](client/vite.config.ts) | **Dev proxy**: `'/tasks' → http://localhost:3001` so the browser can call `fetch('/tasks')` on port 5173. Also **`@` alias** to `src/`. |
| F3 | [`client/src/main.tsx`](client/src/main.tsx) | **`NuqsAdapter`** from `nuqs/adapters/react` wraps the app so **nuqs** hooks can read/write `window.location.search`. |
| F4 | [`client/src/lib/task-url-state.ts`](client/src/lib/task-url-state.ts) | **URL parsers**: `fStatus` / `fPriority` for list filters, `newTitle` / `newDescription` / `newStatus` / `newPriority` for the new-task form. Throttle on long text so the URL does not update on every single keystroke. |
| F5 | [`client/src/lib/api.ts`](client/src/lib/api.ts) | **`fetch` wrapper**: adds `VITE_API_KEY` as `X-API-Key` if set, parses JSON errors, and throws **`ApiError`** with **HTTP status** + body. It understands server **`{ error, details }`** (Zod **flatten** on 400). |
| F6 | [`client/src/lib/task-presentation.ts`](client/src/lib/task-presentation.ts) | **Pure UI helpers**: which **Badge** variant to use for priority/status, and date formatting. |
| F7 | [`client/src/types.ts`](client/src/types.ts) | **Shared `Task` type** aligned with the API. |
| F8 | [`client/src/App.tsx`](client/src/App.tsx) | **Main screen**: `useQueryStates` syncs filter + draft fields to the URL; `useEffect` refetches the list when filters change; form uses **Zod** before `POST`; inline status uses `PATCH`; delete uses **AlertDialog** + `DELETE`. |
| F9 | [`client/src/components/ui/*`](client/src/components/ui) | **shadcn/ui** (Radix + Tailwind): Button, Card, Select, etc. — accessibility and focus styles. |

### URL query keys (for demos)

| Key | Meaning |
| --- | --- |
| `fStatus` | List filter: `all` or `todo` / `in-progress` / `done` |
| `fPriority` | List filter: `all` or `low` / `medium` / `high` |
| `newTitle` | New task title (draft) |
| `newDescription` | New task description (draft) |
| `newStatus` | New task default status |
| `newPriority` | New task default priority |

---

## 4) Validation and HTTP errors (what to say in the interview)

**Backend**

- Invalid query or body → **400** + JSON (often `error: "Validation failed"` and Zod `details.flatten()`).
- Missing task on PATCH/DELETE → **404** + `{ error: "Task not found" }`.
- Bad/missing API key (when `API_KEY` is set) → **401**.

**Frontend**

- **Client validation**: new-task `title` (required, max length) and `description` max length with **Zod** in `App.tsx` before calling `createTask`. Field-level messages under inputs.
- **Server errors**: `api.ts` throws **`ApiError`**; `App` shows **`err.message`**, which includes the first Zod field error when the API sends a flatten payload.
- **Reload-safe UI**: `nuqs` keeps filters and draft in the **URL**, not just React state.

---

## 5) Commands (for a live demo)

```bash
npm install
npm run dev          # API :3001, UI :5173
npm test             # server API tests
npm run build && npm start   # one server :3001, UI + /tasks
```

---

## 6) Optional “what I’d do next”

- Paginate `GET /tasks`, or add indexes if the table grows.
- Replace “real-time-like” UI with WebSockets or SSE for multi-user.
- **Drag-and-drop** order would add a `sort_order` column and a reorder endpoint (see the original spec bonus).
