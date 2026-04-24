import type { RequestHandler } from "express"

export const requireApiKeyWhenConfigured: RequestHandler = (req, res, next) => {
  const key = process.env.API_KEY
  if (!key) {
    return next()
  }
  const header = req.get("X-API-Key")
  if (header === key) {
    return next()
  }
  res.status(401).json({ error: "Invalid or missing X-API-Key" })
}
