# Interview walkthrough — how the app is built

## Big picture

- **Browser** → React (Vite). The UI calls **`/tasks`**. In dev, Vite **proxies** to Express on `3002`.
- **Optional auth** — if `API_KEY` is set, every request needs **`X-API-Key`**.
- **SQLite** for persistence. **`sort_order`** supports drag-and-drop order **per status** column.
- **Zod** validates queries and JSON on the **server**; the create form has light checks on the client.
- **@dnd-kit** (sortable) for reordering; **`PATCH /tasks/reorder`** saves the new order.

```text
[ React + @dnd-kit ]  --fetch  -->  [ Express /tasks  +  optional API key ]  -->  [ SQLite ]
```

## Backend (read in order)

| # | File | Role |
| - | ---- | ---- |
| B1 | `server/src/index.ts` | `PORT`, `getDb()`, listen. |
| B2 | `server/src/app.ts` | CORS, JSON, `/tasks` + **API key** middleware, static `client/dist` in production. |
| B3 | `server/src/middleware/apiKey.ts` | If `API_KEY` is set, require `X-API-Key`. |
| B4 | `server/src/db.ts` | SQLite path, schema + **`sort_order` migration**. |
| B5 | `server/src/validation.ts` | Zod: query, `POST` body, `PATCH` body, **`reorder` body**. |
| B6 | `server/src/types.ts` | `Task` / `TaskRow` (snake → camel) including **`sortOrder`**. |
| B7 | `server/src/routes/tasks.ts` | `GET` / `POST` / `PATCH /reorder` (before `/:id`) / `PATCH` / `DELETE`. |
| B8 | `server/src/tasks.test.ts` | Supertest + in-memory DB + `set-test-env` (`API_KEY` for tests). |

## Frontend (read in order)

| # | File | Role |
| - | ---- | ---- |
| F1 | `client/vite.config.ts` | Dev proxy, `@` → `src/`. |
| F2 | `client/src/main.tsx` | Mount. |
| F3 | `client/src/lib/api.ts` | `fetch` + optional **`VITE_API_KEY`**, `reorder` helper. |
| F4 | `client/src/types.ts` | `Task` including **`sortOrder`**. |
| F5 | `client/src/tasks/use-tasks-page.ts` | State, load, create, **reorder** after DnD, patch, delete. |
| F6 | `client/src/tasks/task-board.tsx` | **@dnd-kit** DnD + columns. |
| F7 | `client/src/tasks/task-card.tsx` | One task card; grip is the sort handle. |
| F8 | Remaining in `client/src/tasks/` | Forms, filters, delete dialog, constants, badge helpers. |

## Commands

```bash
npm install
npm run dev
npm test
```

## Optional follow-ups

- E2E tests, pagination, or auth beyond a static key (proper users).
