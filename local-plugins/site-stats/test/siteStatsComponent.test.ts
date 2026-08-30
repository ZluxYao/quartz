import assert from "node:assert/strict"
import test from "node:test"
import vm from "node:vm"
import { render } from "preact-render-to-string"
import { SiteStats } from "../dist/components/index.js"

test("renders configured uptime and live statistic placeholders", () => {
  const Component = SiteStats({
    siteStartedAt: "2026-08-23T00:00:00+08:00",
    endpoint: "/api/site-stats",
  })
  const html = render(
    Component({
      cfg: { locale: "zh-CN" },
      displayClass: "footer-item",
    } as never),
  )

  assert.match(html, /data-site-stats/)
  assert.match(html, /data-site-started-at="2026-08-23T00:00:00\+08:00"/)
  assert.match(html, /data-site-stats-endpoint="\/api\/site-stats"/)
  assert.match(html, /本站已运行/)
  assert.match(html, /当前在线/)
  assert.match(html, /总访客/)
  assert.match(html, /总浏览/)
  assert.match(Component.afterDOMLoaded as string, /quartz-site-stats-visitor/)
})

test("rejects invalid options", () => {
  assert.throws(() => SiteStats({ siteStartedAt: "not-a-date" }), /Invalid siteStartedAt/)
  assert.throws(() => SiteStats({ endpoint: "api/site-stats" }), /must start with/)
})

test("runs on HTTP origins where crypto.randomUUID is unavailable", async () => {
  const Component = SiteStats({
    siteStartedAt: "2026-08-23T00:00:00+08:00",
    endpoint: "/api/site-stats",
  })
  const targets = new Map<string, { textContent: string }>()
  const listeners = new Map<string, () => void>()
  const requests: Array<{ url: string; body: string }> = []

  class FakeHTMLElement {
    dataset: Record<string, string> = {
      siteStartedAt: "2026-08-23T00:00:00+08:00",
      siteStatsEndpoint: "/api/site-stats",
    }

    querySelector(selector: string) {
      const name = selector.match(/data-site-stat="([^"]+)"/)?.[1]
      if (!name) return null
      if (!targets.has(name)) targets.set(name, { textContent: "--" })
      return targets.get(name) ?? null
    }
  }

  const shell = new FakeHTMLElement()
  const runtimeWindow = {
    addEventListener() {},
    setInterval() {},
  }
  const context = {
    window: runtimeWindow,
    document: {
      documentElement: { lang: "zh-CN" },
      visibilityState: "visible",
      querySelectorAll: () => [shell],
      addEventListener: (name: string, listener: () => void) => listeners.set(name, listener),
    },
    HTMLElement: FakeHTMLElement,
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    crypto: {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(42)
        return bytes
      },
    },
    fetch: async (url: string, options: { body: string }) => {
      requests.push({ url, body: options.body })
      return {
        ok: true,
        json: async () => ({ online: 1, visitors: 1, views: 1 }),
      }
    },
    navigator: { sendBeacon: () => true },
    location: { pathname: "/" },
    Blob,
  }

  vm.runInNewContext(Component.afterDOMLoaded as string, context)
  assert.notEqual(targets.get("uptime")?.textContent, "--")

  listeners.get("nav")?.()
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(requests[0]?.url, "/api/site-stats/view")
  assert.match(requests[0]?.body ?? "", /"eventId":"[a-f0-9]{48}"/)
  assert.equal(targets.get("online")?.textContent, "1")
})
