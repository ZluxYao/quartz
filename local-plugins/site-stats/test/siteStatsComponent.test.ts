import assert from "node:assert/strict"
import test from "node:test"
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
