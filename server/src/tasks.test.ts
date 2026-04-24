import "./set-test-env.js"
import assert from "node:assert/strict"
import { test } from "node:test"
import request from "supertest"
import { createApp } from "./app.js"
import { getDb } from "./db.js"

const app = createApp()
getDb()

test("GET /tasks returns 200 and a JSON array", async () => {
  const res = await request(app).get("/tasks")
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
})

test("POST /tasks creates a task; GET can filter", async () => {
  const create = await request(app)
    .post("/tasks")
    .send({
      title: "Unit test task",
      description: "",
      status: "todo",
      priority: "high",
    })
  assert.equal(create.status, 201)
  assert.equal(create.body.title, "Unit test task")
  const id = create.body.id
  assert.ok(typeof id === "string")

  const list = await request(app).get("/tasks").query({ status: "todo", priority: "high" })
  assert.equal(list.status, 200)
  assert.ok(Array.isArray(list.body))
  assert.ok(list.body.some((t: { id: string }) => t.id === id))
})
