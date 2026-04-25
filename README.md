# Mini Task Manager — Technical Assessment

A **full-stack** task app: **Express** + **SQLite** + **Zod** on the back end, **React (Vite)** + **Tailwind** + **@dnd-kit** on the front end. It matches the “Mini Task Manager” brief: CRUD, query filters, client validation, inline status, delete confirmation, responsive UI, and **all optional bonuses** (API key, tests, drag-and-drop).

---

## 1) What you need

- **Node.js 20+**
- **npm**

---

## 2) Run locally (quickest)

In the **repository root** (this folder, after you clone):

### Step 1 — Install

```bash
npm install
```

This installs the root workspace and both **client** and **server** packages.

### Step 2 — Start API + web UI in development

```bash
npm run dev
```

- **UI:** open [http://localhost:5173](http://localhost:5173) in the browser.
- **API:** the server listens on [http://localhost:3002](http://localhost:3002) under the path **`/tasks`**.
- In dev, the Vite app **proxies** `/tasks` to that server, so the React code can call `fetch("/tasks", …)`.

> **If you do not set an API key** (next section), you do not need to configure anything else: the app should work for local testing.

### Step 3 (optional) — API key in dev

If you want to use the same **header auth** the bonus describes:

1. In **`server/.env`** (or your shell) set, for example:  
   `API_KEY=dev-secret`
2. In **`client/.env` or `client/.env.local`** set:  
   `VITE_API_KEY=dev-secret`  
   (It must be the same string as the server’s `API_KEY`.)

The client sends it as the **`X-API-Key`** header. If `API_KEY` is **not** set on the server, the API is open and the client does not need a key. See [`.env.example`](.env.example) for a full list of variables.

---

## 3) Run a production build (one process)

**Step 1 — Build the client and compile the server**

```bash
npm run build
```

**Step 2 — Start** (serves the built React app and `/tasks` on one port)

```bash
PORT=3002 NODE_ENV=production npm start
```

**Step 3** — Open [http://localhost:3002](http://localhost:3002) (or your `PORT`).

`NODE_ENV=production` makes Express serve the static files from `client/dist`, so a single process hosts both UI and API.

---

## 4) Other useful commands

| Command                     | When to use it                                                 |
| --------------------------- | -------------------------------------------------------------- |
| `npm test`                  | Runs the **server** API tests (Node’s test runner + supertest) |
| `cd client && npm run lint` | Lints the React/TS code                                        |

---

## 5) API (short reference)

| Method   | Path             | Description                                                                                                                              |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/tasks`         | List tasks. Optional: `?status=todo&priority=high`                                                                                       |
| `POST`   | `/tasks`         | Create (JSON: `title`, `description`, `status`, `priority`); `id` and `createdAt` and `sortOrder` are set on the server                  |
| `PATCH`  | `/tasks/reorder` | **Bonus (DnD):** body `{ "status": "todo", "orderedIds": ["id1", "id2", …] }` — new order in that **status** column. **204** on success. |
| `PATCH`  | `/tasks/:id`     | Update any subset of fields. **400** if invalid, **404** if not found.                                                                   |
| `DELETE` | `/tasks/:id`     | **204** if deleted, **404** if not found.                                                                                                |

If **`API_KEY`** is set, every `.../tasks/...` request must include **`X-API-Key: <same value>`** or the response is **401**.

---

## 6) Bonuses (all implemented in this repo)

| Bonus             | What we did                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit tests**    | `npm test` — covers `GET`, `POST` + filter, `PATCH /tasks/reorder`, 401 when key is missing, 404s, `sortOrder` in JSON.                                                                   |
| **API key**       | Optional env `API_KEY` on the server; client uses `VITE_API_KEY` → `X-API-Key`.                                                                                                           |
| **Drag-and-drop** | **`@dnd-kit`** (`@dnd-kit/core` + `sortable` + `utilities`) — 3 **status** columns; drag the **grip** handle to reorder **within** a column; `PATCH /tasks/reorder` persists `sortOrder`. |

---

## 7) Core requirements (from the spec)

- **CRUD** on `/tasks` with the fields and enums from the brief.
- **Filtering** on `GET` without reloading the full page.
- **Form** for new tasks with **client-side** checks before `POST`.
- **Inline** status change + **delete** with a **confirmation** dialog.
- **Layout** that works on mobile (columns stack; drag still works on touch with the handle).

---

## 8) Assumptions & trade-offs

- **SQLite** + one file: easy to run locally; a hosted SQL DB is the usual next step for real traffic.
- **“Real-time-like”** means the list updates **as soon as the API responds**; there is no WebSocket.
- **Drag-and-drop** is only **inside** a single status column (per the spec).
- A step-by-step **code map** (optional) is in [INTERVIEW_WALKTHROUGH.md](INTERVIEW_WALKTHROUGH.md).

## License

Private / assessment use unless you add your own license.
