import "./set-test-env.js"
import assert from "node:assert/strict"
import { test } from "node:test"
import request from "supertest"
import { createApp } from "./app.js"
import { getDb } from "./db.js"

const key = { "X-API-Key": "test-api-key" as const }
const app = createApp()
getDb()

test("GET /tasks without X-API-Key returns 401", async () => {
  const res = await request(app).get("/tasks")
  assert.equal(res.status, 401)
  assert.equal(res.body.error, "Unauthorized")
})

test("GET /tasks with key returns 200 and a JSON array", async () => {
  const res = await request(app).get("/tasks").set(key)
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.equal(res.body.length, 0)
})

test("POST /tasks creates a task; GET can filter; task has sortOrder", async () => {
  const create = await request(app)
    .post("/tasks")
    .set(key)
    .send({
      title: "Unit test task",
      description: "",
      status: "todo",
      priority: "high",
    })
  assert.equal(create.status, 201)
  assert.equal(create.body.title, "Unit test task")
  assert.equal(typeof create.body.sortOrder, "number")
  const id = create.body.id
  assert.ok(typeof id === "string")

  const list = await request(app)
    .get("/tasks")
    .set(key)
    .query({ status: "todo", priority: "high" })
  assert.equal(list.status, 200)
  assert.ok(Array.isArray(list.body))
  assert.ok(list.body.some((t: { id: string }) => t.id === id))
})

test("PATCH /reorder reorders within status", async () => {
  const a = await request(app)
    .post("/tasks")
    .set(key)
    .send({ title: "A", description: "", status: "todo", priority: "low" })
  const b = await request(app)
    .post("/tasks")
    .set(key)
    .send({ title: "B", description: "", status: "todo", priority: "low" })
  assert.equal(a.status, 201)
  assert.equal(b.status, 201)
  const idA = a.body.id as string
  const idB = b.body.id as string

  const patch = await request(app)
    .patch("/tasks/reorder")
    .set(key)
    .send({ status: "todo", orderedIds: [idB, idA] })
  assert.equal(patch.status, 204)

  const list = await request(app).get("/tasks").set(key).query({ status: "todo" })
  const idxB = list.body.findIndex((t: { id: string }) => t.id === idB)
  const idxA = list.body.findIndex((t: { id: string }) => t.id === idA)
  assert.ok(idxB >= 0 && idxA >= 0)
  assert.ok(idxB < idxA, "B should appear before A after reorder")
})

test("DELETE /tasks/:id missing returns 404", async () => {
  const res = await request(app).delete("/tasks/nonexistent").set(key)
  assert.equal(res.status, 404)
})

test("PATCH /tasks/:id missing returns 404", async () => {
  const res = await request(app).patch("/tasks/nonexistent").set(key).send({ title: "x" })
  assert.equal(res.status, 404)
})
