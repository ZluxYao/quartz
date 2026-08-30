import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { SiteStatsStore } from "./site-stats.js"

function withStore(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "quartz-site-stats-"))
  const databasePath = path.join(directory, "stats.sqlite")
  const store = new SiteStatsStore({ databasePath, ...options })
  t.after(() => {
    store.close()
    fs.rmSync(directory, { recursive: true, force: true })
  })
  return { store, databasePath }
}

test("counts page views and unique visitors", (t) => {
  const { store } = withStore(t)
  const first = store.recordView(
    {
      visitorId: "visitor-000000000001",
      sessionId: "session-000000000001",
      eventId: "event-00000000000001",
      pagePath: "/notes/one",
    },
    1_000,
  )
  const second = store.recordView(
    {
      visitorId: "visitor-000000000001",
      sessionId: "session-000000000001",
      eventId: "event-00000000000002",
      pagePath: "/notes/two",
    },
    2_000,
  )

  assert.deepEqual(
    { online: first.online, visitors: first.visitors, views: first.views },
    { online: 1, visitors: 1, views: 1 },
  )
  assert.deepEqual(
    { online: second.online, visitors: second.visitors, views: second.views },
    { online: 1, visitors: 1, views: 2 },
  )
})

test("deduplicates retried page-view events", (t) => {
  const { store } = withStore(t)
  const view = {
    visitorId: "visitor-000000000001",
    sessionId: "session-000000000001",
    eventId: "event-00000000000001",
    pagePath: "/",
  }

  store.recordView(view, 1_000)
  const summary = store.recordView(view, 2_000)

  assert.equal(summary.visitors, 1)
  assert.equal(summary.views, 1)
})

test("tracks one online visitor across tabs and expires stale sessions", (t) => {
  const { store } = withStore(t, { onlineTtlMs: 90_000 })
  store.heartbeat("visitor-000000000001", "session-000000000001", 1_000)
  store.heartbeat("visitor-000000000001", "session-000000000002", 10_000)
  store.heartbeat("visitor-000000000002", "session-000000000003", 20_000)

  assert.equal(store.getSummary(30_000).online, 2)
  store.leave("visitor-000000000001", "session-000000000001", 40_000)
  assert.equal(store.getSummary(40_000).online, 2)
  assert.equal(store.getSummary(100_001).online, 1)
  assert.equal(store.getSummary(110_001).online, 0)
})

test("persists visitor and view totals across restarts", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "quartz-site-stats-"))
  const databasePath = path.join(directory, "stats.sqlite")
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))

  const firstStore = new SiteStatsStore({ databasePath })
  firstStore.recordView(
    {
      visitorId: "visitor-000000000001",
      sessionId: "session-000000000001",
      eventId: "event-00000000000001",
      pagePath: "/",
    },
    1_000,
  )
  firstStore.close()

  const secondStore = new SiteStatsStore({ databasePath })
  const summary = secondStore.getSummary(2_000)
  secondStore.close()

  assert.equal(summary.online, 0)
  assert.equal(summary.visitors, 1)
  assert.equal(summary.views, 1)
  assert.match(summary.statsStartedAt, /^\d{4}-\d{2}-\d{2}T/)
})
