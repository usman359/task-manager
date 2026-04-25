import { createApp } from "./app.js"
import { getDb } from "./db.js"

const app = createApp()
const port = Number(process.env.PORT) || 3002

getDb()

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})

process.on("SIGTERM", () => {
  server.close()
})
