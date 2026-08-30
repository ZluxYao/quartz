;(() => {
  if (window.__siteStatsRuntime) return
  window.__siteStatsRuntime = { version: 1 }

  const visitorStorageKey = "quartz-site-stats-visitor"
  const heartbeatIntervalMs = 30_000
  let renderedResponse = 0
  let requestSequence = 0
  let hasRenderedStats = false

  const createIdentifier = () => {
    const cryptoApi = globalThis.crypto
    if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID()

    const bytes = new Uint8Array(24)
    if (typeof cryptoApi?.getRandomValues === "function") {
      cryptoApi.getRandomValues(bytes)
    } else {
      for (let index = 0; index < bytes.length; index++) {
        bytes[index] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }
  const sessionId = createIdentifier()
  const readVisitorId = () => {
    try {
      const stored = localStorage.getItem(visitorStorageKey)
      if (stored && /^[a-zA-Z0-9_-]{16,80}$/.test(stored)) return stored
      const created = createIdentifier()
      localStorage.setItem(visitorStorageKey, created)
      return created
    } catch {
      return createIdentifier()
    }
  }
  const visitorId = readVisitorId()

  const getShells = () =>
    Array.from(document.querySelectorAll("[data-site-stats]")).filter(
      (shell) => shell instanceof HTMLElement,
    )

  const getEndpoint = () => getShells()[0]?.dataset.siteStatsEndpoint ?? "/api/site-stats"

  const setValue = (shell, name, value) => {
    const target = shell.querySelector(`[data-site-stat="${name}"]`)
    if (target && target.textContent !== value) target.textContent = value
  }

  const numberFormatter = new Intl.NumberFormat(document.documentElement.lang || "zh-CN")

  const renderUptime = () => {
    for (const shell of getShells()) {
      const startedAt = Date.parse(shell.dataset.siteStartedAt ?? "")
      if (Number.isNaN(startedAt)) continue
      const elapsedDays = Math.max(0, Math.floor((Date.now() - startedAt) / 86_400_000))
      setValue(shell, "uptime", numberFormatter.format(elapsedDays))
    }
  }

  const renderSummary = (summary) => {
    for (const shell of getShells()) {
      setValue(shell, "online", numberFormatter.format(summary.online))
      setValue(shell, "visitors", numberFormatter.format(summary.visitors))
      setValue(shell, "views", numberFormatter.format(summary.views))
      shell.dataset.siteStatsState = "ready"
      if (summary.statsStartedAt) shell.dataset.statsStartedAt = summary.statsStartedAt
    }
    hasRenderedStats = true
  }

  const send = async (action, payload) => {
    const sequence = ++requestSequence
    try {
      const response = await fetch(`${getEndpoint()}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, sessionId, ...payload }),
        cache: "no-store",
        credentials: "same-origin",
      })
      if (!response.ok) throw new Error(`Site statistics returned ${response.status}`)
      const summary = await response.json()
      if (sequence >= renderedResponse) {
        renderedResponse = sequence
        renderSummary(summary)
      }
    } catch {
      if (!hasRenderedStats) {
        for (const shell of getShells()) shell.dataset.siteStatsState = "error"
      }
    }
  }

  const recordView = () => {
    renderUptime()
    return send("view", {
      eventId: createIdentifier(),
      path: location.pathname,
    })
  }

  const heartbeat = () => {
    if (document.visibilityState === "visible") void send("heartbeat", {})
  }

  const leave = () => {
    const body = JSON.stringify({ visitorId, sessionId })
    const endpoint = `${getEndpoint()}/leave`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }))
      return
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: true,
    })
  }

  renderUptime()
  document.addEventListener("nav", () => void recordView())
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") heartbeat()
    else leave()
  })
  window.addEventListener("pagehide", leave)
  window.setInterval(() => {
    renderUptime()
    heartbeat()
  }, heartbeatIntervalMs)
})()
