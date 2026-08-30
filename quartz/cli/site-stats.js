import fs from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

const DEFAULT_DATABASE_PATH = path.join("data", "site-stats.sqlite")
const DEFAULT_ONLINE_TTL_MS = 90_000
const MAX_BODY_BYTES = 8 * 1024
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/

function toNumber(value) {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0)
}

function normalizePagePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return null

  try {
    const pathname = new URL(value, "http://site-stats.local").pathname
    return pathname.startsWith("/") ? pathname : null
  } catch {
    return null
  }
}

function isValidIdentifier(value) {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value)
}

export class SiteStatsStore {
  constructor({ databasePath = DEFAULT_DATABASE_PATH, onlineTtlMs = DEFAULT_ONLINE_TTL_MS } = {}) {
    this.databasePath = path.resolve(databasePath)
    this.onlineTtlMs = onlineTtlMs
    this.activeSessions = new Map()

    fs.mkdirSync(path.dirname(this.databasePath), { recursive: true })
    this.database = new DatabaseSync(this.databasePath)
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        visitor_id TEXT NOT NULL REFERENCES visitors(id),
        path TEXT NOT NULL,
        viewed_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views(path);
      CREATE INDEX IF NOT EXISTS page_views_viewed_at_idx ON page_views(viewed_at);
    `)

    this.database
      .prepare("INSERT OR IGNORE INTO metadata (key, value) VALUES ('stats_started_at', ?)")
      .run(new Date().toISOString())

    this.upsertVisitorStatement = this.database.prepare(`
      INSERT INTO visitors (id, first_seen, last_seen)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen
    `)
    this.insertPageViewStatement = this.database.prepare(`
      INSERT OR IGNORE INTO page_views (event_id, visitor_id, path, viewed_at)
      VALUES (?, ?, ?, ?)
    `)
    this.countVisitorsStatement = this.database.prepare("SELECT COUNT(*) AS count FROM visitors")
    this.countViewsStatement = this.database.prepare("SELECT COUNT(*) AS count FROM page_views")
    this.startedAtStatement = this.database.prepare(
      "SELECT value FROM metadata WHERE key = 'stats_started_at'",
    )
  }

  recordView({ visitorId, sessionId, eventId, pagePath }, now = Date.now()) {
    this.database.exec("BEGIN IMMEDIATE")
    try {
      this.upsertVisitorStatement.run(visitorId, now, now)
      this.insertPageViewStatement.run(eventId, visitorId, pagePath, now)
      this.database.exec("COMMIT")
    } catch (error) {
      this.database.exec("ROLLBACK")
      throw error
    }

    return this.heartbeat(visitorId, sessionId, now)
  }

  heartbeat(visitorId, sessionId, now = Date.now()) {
    let sessions = this.activeSessions.get(visitorId)
    if (!sessions) {
      sessions = new Map()
      this.activeSessions.set(visitorId, sessions)
    }
    sessions.set(sessionId, now)
    return this.getSummary(now)
  }

  leave(visitorId, sessionId, now = Date.now()) {
    const sessions = this.activeSessions.get(visitorId)
    sessions?.delete(sessionId)
    if (sessions?.size === 0) this.activeSessions.delete(visitorId)
    return this.getSummary(now)
  }

  getSummary(now = Date.now()) {
    this.removeExpiredSessions(now)
    const visitors = toNumber(this.countVisitorsStatement.get()?.count)
    const views = toNumber(this.countViewsStatement.get()?.count)
    const statsStartedAt = this.startedAtStatement.get()?.value ?? null

    return {
      online: this.activeSessions.size,
      visitors,
      views,
      statsStartedAt,
    }
  }

  removeExpiredSessions(now = Date.now()) {
    const expiresBefore = now - this.onlineTtlMs
    for (const [visitorId, sessions] of this.activeSessions) {
      for (const [sessionId, lastSeen] of sessions) {
        if (lastSeen <= expiresBefore) sessions.delete(sessionId)
      }
      if (sessions.size === 0) this.activeSessions.delete(visitorId)
    }
  }

  close() {
    this.database.close()
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  })
  response.end(JSON.stringify(body))
}

function isSameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return true

  const fetchSite = request.headers["sec-fetch-site"]
  if (fetchSite === "same-origin" || fetchSite === "same-site") return true
  if (fetchSite === "cross-site") return false

  try {
    const forwardedHost = request.headers["x-forwarded-host"]
    const requestHost =
      typeof forwardedHost === "string" ? forwardedHost.split(",")[0]?.trim() : request.headers.host
    return new URL(origin).host === requestHost
  } catch {
    return false
  }
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers["content-length"] ?? 0)
  if (contentLength > MAX_BODY_BYTES) throw new Error("request body is too large")

  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error("request body is too large")
    chunks.push(chunk)
  }

  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

function readClientIdentifiers(body) {
  const visitorId = body?.visitorId
  const sessionId = body?.sessionId
  if (!isValidIdentifier(visitorId) || !isValidIdentifier(sessionId)) return null
  return { visitorId, sessionId }
}

export function createSiteStatsService(options = {}) {
  const store = new SiteStatsStore(options)
  const endpoint = options.endpoint ?? "/api/site-stats"

  return {
    store,
    async handle(request, response) {
      const pathname = new URL(request.url ?? "/", "http://site-stats.local").pathname
      if (pathname !== endpoint && !pathname.startsWith(`${endpoint}/`)) return false

      if (!isSameOrigin(request)) {
        sendJson(response, 403, { error: "cross-origin requests are not allowed" })
        return true
      }

      try {
        if (pathname === endpoint && request.method === "GET") {
          sendJson(response, 200, store.getSummary())
          return true
        }

        if (request.method !== "POST") {
          sendJson(response, 405, { error: "method not allowed" })
          return true
        }

        const body = await readJsonBody(request)
        const identifiers = readClientIdentifiers(body)
        if (!identifiers) {
          sendJson(response, 400, { error: "invalid visitor or session identifier" })
          return true
        }

        if (pathname === `${endpoint}/view`) {
          const eventId = body?.eventId
          const pagePath = normalizePagePath(body?.path)
          if (!isValidIdentifier(eventId) || !pagePath) {
            sendJson(response, 400, { error: "invalid page view" })
            return true
          }
          sendJson(response, 200, store.recordView({ ...identifiers, eventId, pagePath }))
          return true
        }

        if (pathname === `${endpoint}/heartbeat`) {
          sendJson(response, 200, store.heartbeat(identifiers.visitorId, identifiers.sessionId))
          return true
        }

        if (pathname === `${endpoint}/leave`) {
          sendJson(response, 200, store.leave(identifiers.visitorId, identifiers.sessionId))
          return true
        }

        sendJson(response, 404, { error: "not found" })
        return true
      } catch (error) {
        console.error("Site statistics request failed:", error)
        if (!response.headersSent) sendJson(response, 400, { error: "invalid request" })
        else response.end()
        return true
      }
    },
    close() {
      store.close()
    },
  }
}
