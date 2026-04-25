# Mini Task Manager

Full-stack task manager: **Express** + **SQLite** (better-sqlite3) REST API, **React** + **Vite** + **Tailwind** + **shadcn/ui** client.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+

## One-command development

From the repository root (after a fresh `git clone`):

```bash
npm install
npm run dev
```

This runs the API on **http://localhost:3001** and the Vite app on **http://localhost:5173**. The Vite dev server **proxies** `GET/POST/PATCH/DELETE` on `/tasks` to the API, so the browser can call `fetch("/tasks", …)`.

- Open **http://localhost:5173** in your browser to use the UI.

## Production build

```bash
npm run build
```

Then start the server with `NODE_ENV=production` so it serves the built SPA and the same `/tasks` API on one port:

```bash
PORT=3001 NODE_ENV=production npm start
```

Open **http://localhost:3001** (or your chosen `PORT`).

On Windows, set variables in the shell or use a small wrapper; on macOS/Linux, the line above is enough.

## Optional API key

- Set `API_KEY` in the environment when **starting the server** (or copy `.env.example` to `.env` in `server/` and use `dotenv` — the server already loads `dotenv/config`).
- In development, if you use a key, set `VITE_API_KEY` the same in `client/.env` / `.env.local` so the client sends `X-API-Key`. Without `API_KEY` on the server, auth is off.

## Tests

```bash
npm test
```

(Runs `npm run test` in the `server` workspace.)

## Environment variables (summary)

| Variable        | Where   | Description                                      |
| --------------- | ------- | ------------------------------------------------ |
| `PORT`          | server  | Listen port (default `3001`)                    |
| `NODE_ENV`      | server  | `production` enables static file serving         |
| `DATABASE_PATH` | server  | SQLite file path or `:memory:` (e.g. for tests) |
| `API_KEY`       | server  | If set, required `X-API-Key` for `/tasks`        |
| `VITE_API_KEY`  | client  | Sent as `X-API-Key` if set (must match `API_KEY`) |
| `VITE_API_BASE` | client  | API origin prefix; empty = same origin / proxy   |

See [.env.example](.env.example).

## URL state (nuqs)

The client uses **[nuqs](https://github.com/47ng/nuqs)** with the Vite/SPA **adapter** (`NuqsAdapter` in `client/src/main.tsx`). List filters and the “new task” draft fields are stored in the **query string** (e.g. `fStatus`, `fPriority`, `newTitle`, `newDescription`, `newStatus`, `newPriority`) so **reloads** and **shared links** keep the same view. Long text uses **throttle** on URL updates to avoid work per keystroke.

## Assumptions and trade-offs

- **No drag-and-drop ordering** in this build; the data model is simple CRUD + filters. A `sort_order` column and a `PUT /tasks/reorder` (or per-status ordering) would be the next step.
- **“Real-time” updates** are **immediate after API success** (no WebSockets). Good enough for the brief’s “real-time-like” phrasing.
- **SQLite** is file-based, works locally with no extra services; for heavy concurrency, PostgreSQL + connection pooling would be a natural upgrade.
- **Auth** is an optional static API key, not end-user auth.

**Interview / code tour:** see [INTERVIEW_WALKTHROUGH.md](INTERVIEW_WALKTHROUGH.md) for a step-by-step file list (backend and frontend) you can use when explaining the project.

## API

| Method   | Path           | Description                                |
| -------- | -------------- | ------------------------------------------ |
| `GET`    | `/tasks`       | Optional query: `?status=&priority=`        |
| `POST`   | `/tasks`       | JSON body: `title`, `description`, `status`, `priority` |
| `PATCH`  | `/tasks/:id`  | JSON body: any subset of task fields        |
| `DELETE` | `/tasks/:id`  | `204` on success                            |

`status` ∈ `todo` \| `in-progress` \| `done`. `priority` ∈ `low` \| `medium` \| `high`. Responses use **camelCase** for dates: `createdAt` (ISO 8601).

## Project layout

- `server/` — Express, validation (Zod), SQLite
- `client/` — Vite + React + shadcn/ui

## License

Private / assessment use unless you add your own license.
