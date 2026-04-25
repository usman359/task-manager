import type { RequestHandler } from "express"

/**
 * If `API_KEY` is set in the environment, every request must send `X-API-Key: <value>`.
 * If `API_KEY` is unset, no header is required (good for local dev without secrets).
 */
export const requireApiKeyWhenConfigured: RequestHandler = (req, res, next) => {
  const expected = process.env.API_KEY
  if (!expected) {
    return next()
  }
  const sent = req.get("X-API-Key")
  if (sent !== expected) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}
