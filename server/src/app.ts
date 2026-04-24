import "dotenv/config"
import path from "node:path"
import { fileURLToPath } from "node:url"
import cors from "cors"
import express from "express"
import { requireApiKeyWhenConfigured } from "./middleware/apiKey.js"
import { tasksRouter } from "./routes/tasks.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.join(__dirname, "..", "..", "client", "dist")

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: "1mb" }))

  app.use("/tasks", requireApiKeyWhenConfigured, tasksRouter)

  if (process.env.NODE_ENV === "production") {
    // API is mounted at /tasks; everything else is the built SPA
    app.use(express.static(clientDist, { index: "index.html" }))
  }

  return app
}
