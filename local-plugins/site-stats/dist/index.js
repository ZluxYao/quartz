// src/components/scripts/siteStats.inline.ts?raw
var siteStats_inline_default = ';(() => {\n  if (window.__siteStatsRuntime) return\n  window.__siteStatsRuntime = { version: 1 }\n\n  const visitorStorageKey = "quartz-site-stats-visitor"\n  const heartbeatIntervalMs = 30_000\n  const sessionId = crypto.randomUUID()\n  let renderedResponse = 0\n  let requestSequence = 0\n  let hasRenderedStats = false\n\n  const createVisitorId = () => crypto.randomUUID()\n  const readVisitorId = () => {\n    try {\n      const stored = localStorage.getItem(visitorStorageKey)\n      if (stored && /^[a-zA-Z0-9_-]{16,80}$/.test(stored)) return stored\n      const created = createVisitorId()\n      localStorage.setItem(visitorStorageKey, created)\n      return created\n    } catch {\n      return createVisitorId()\n    }\n  }\n  const visitorId = readVisitorId()\n\n  const getShells = () =>\n    Array.from(document.querySelectorAll("[data-site-stats]")).filter(\n      (shell) => shell instanceof HTMLElement,\n    )\n\n  const getEndpoint = () => getShells()[0]?.dataset.siteStatsEndpoint ?? "/api/site-stats"\n\n  const setValue = (shell, name, value) => {\n    const target = shell.querySelector(`[data-site-stat="${name}"]`)\n    if (target && target.textContent !== value) target.textContent = value\n  }\n\n  const numberFormatter = new Intl.NumberFormat(document.documentElement.lang || "zh-CN")\n\n  const renderUptime = () => {\n    for (const shell of getShells()) {\n      const startedAt = Date.parse(shell.dataset.siteStartedAt ?? "")\n      if (Number.isNaN(startedAt)) continue\n      const elapsedDays = Math.max(0, Math.floor((Date.now() - startedAt) / 86_400_000))\n      setValue(shell, "uptime", numberFormatter.format(elapsedDays))\n    }\n  }\n\n  const renderSummary = (summary) => {\n    for (const shell of getShells()) {\n      setValue(shell, "online", numberFormatter.format(summary.online))\n      setValue(shell, "visitors", numberFormatter.format(summary.visitors))\n      setValue(shell, "views", numberFormatter.format(summary.views))\n      shell.dataset.siteStatsState = "ready"\n      if (summary.statsStartedAt) shell.dataset.statsStartedAt = summary.statsStartedAt\n    }\n    hasRenderedStats = true\n  }\n\n  const send = async (action, payload) => {\n    const sequence = ++requestSequence\n    try {\n      const response = await fetch(`${getEndpoint()}/${action}`, {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({ visitorId, sessionId, ...payload }),\n        cache: "no-store",\n        credentials: "same-origin",\n      })\n      if (!response.ok) throw new Error(`Site statistics returned ${response.status}`)\n      const summary = await response.json()\n      if (sequence >= renderedResponse) {\n        renderedResponse = sequence\n        renderSummary(summary)\n      }\n    } catch {\n      if (!hasRenderedStats) {\n        for (const shell of getShells()) shell.dataset.siteStatsState = "error"\n      }\n    }\n  }\n\n  const recordView = () => {\n    renderUptime()\n    return send("view", {\n      eventId: crypto.randomUUID(),\n      path: location.pathname,\n    })\n  }\n\n  const heartbeat = () => {\n    if (document.visibilityState === "visible") void send("heartbeat", {})\n  }\n\n  const leave = () => {\n    const body = JSON.stringify({ visitorId, sessionId })\n    const endpoint = `${getEndpoint()}/leave`\n    if (navigator.sendBeacon) {\n      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }))\n      return\n    }\n    void fetch(endpoint, {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body,\n      credentials: "same-origin",\n      keepalive: true,\n    })\n  }\n\n  renderUptime()\n  document.addEventListener("nav", () => void recordView())\n  document.addEventListener("visibilitychange", () => {\n    if (document.visibilityState === "visible") heartbeat()\n    else leave()\n  })\n  window.addEventListener("pagehide", leave)\n  window.setInterval(() => {\n    renderUptime()\n    heartbeat()\n  }, heartbeatIntervalMs)\n})()\n';

// src/components/styles/siteStats.scss
var siteStats_default = '.site-stats {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.45rem 0;\n  margin: 0 0 1.25rem;\n  color: var(--darkgray);\n  font-size: 0.85rem;\n  line-height: 1.5;\n  opacity: 0.78;\n}\n.site-stats[data-site-stats-state=error] {\n  opacity: 0.55;\n}\n.site-stats .site-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 0.25rem;\n  white-space: nowrap;\n}\n.site-stats .site-stat + .site-stat::before {\n  content: "";\n  align-self: stretch;\n  width: 1px;\n  margin: 0 0.7rem;\n  background: var(--lightgray);\n}\n.site-stats strong {\n  min-width: 1.5ch;\n  color: var(--dark);\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n  text-align: center;\n}\n\n@media (max-width: 480px) {\n  .site-stats {\n    align-items: flex-start;\n  }\n  .site-stats .site-stat + .site-stat::before {\n    margin-inline: 0.5rem;\n  }\n}';
var l;
l = { __e: function(n2, l2, u3, t2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// ../../node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0;
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l.vnode && l.vnode(l2), l2;
}

// src/components/SiteStats.tsx
var DEFAULT_OPTIONS = {
  siteStartedAt: "2026-08-23T00:00:00+08:00",
  endpoint: "/api/site-stats"
};
function normalizeOptions(options) {
  const siteStartedAt = options?.siteStartedAt ?? DEFAULT_OPTIONS.siteStartedAt;
  const endpoint = options?.endpoint ?? DEFAULT_OPTIONS.endpoint;
  if (Number.isNaN(Date.parse(siteStartedAt))) {
    throw new Error(`Invalid siteStartedAt value: ${siteStartedAt}`);
  }
  if (!endpoint.startsWith("/")) {
    throw new Error(`Site statistics endpoint must start with "/": ${endpoint}`);
  }
  return { siteStartedAt, endpoint };
}
var SiteStats = ((options) => {
  const normalized = normalizeOptions(options);
  const Component = ({ displayClass, cfg }) => {
    const classes = displayClass ? `${displayClass} site-stats` : "site-stats";
    const isChinese = cfg.locale.startsWith("zh");
    const labels = isChinese ? {
      uptime: "\u672C\u7AD9\u5DF2\u8FD0\u884C",
      days: "\u5929",
      online: "\u5F53\u524D\u5728\u7EBF",
      people: "\u4EBA",
      visitors: "\u603B\u8BBF\u5BA2",
      views: "\u603B\u6D4F\u89C8",
      times: "\u6B21"
    } : {
      uptime: "Online for",
      days: "days",
      online: "Online",
      people: "visitors",
      visitors: "Total visitors",
      views: "Page views",
      times: "views"
    };
    return /* @__PURE__ */ u2(
      "div",
      {
        class: classes,
        "data-site-stats": true,
        "data-site-started-at": normalized.siteStartedAt,
        "data-site-stats-endpoint": normalized.endpoint,
        "aria-live": "polite",
        children: [
          /* @__PURE__ */ u2("span", { class: "site-stat", children: [
            /* @__PURE__ */ u2("span", { children: labels.uptime }),
            /* @__PURE__ */ u2("strong", { "data-site-stat": "uptime", children: "--" }),
            /* @__PURE__ */ u2("span", { children: labels.days })
          ] }),
          /* @__PURE__ */ u2("span", { class: "site-stat", children: [
            /* @__PURE__ */ u2("span", { children: labels.online }),
            /* @__PURE__ */ u2("strong", { "data-site-stat": "online", children: "--" }),
            /* @__PURE__ */ u2("span", { children: labels.people })
          ] }),
          /* @__PURE__ */ u2("span", { class: "site-stat", children: [
            /* @__PURE__ */ u2("span", { children: labels.visitors }),
            /* @__PURE__ */ u2("strong", { "data-site-stat": "visitors", children: "--" }),
            /* @__PURE__ */ u2("span", { children: labels.people })
          ] }),
          /* @__PURE__ */ u2("span", { class: "site-stat", children: [
            /* @__PURE__ */ u2("span", { children: labels.views }),
            /* @__PURE__ */ u2("strong", { "data-site-stat": "views", children: "--" }),
            /* @__PURE__ */ u2("span", { children: labels.times })
          ] })
        ]
      }
    );
  };
  Component.afterDOMLoaded = siteStats_inline_default;
  Component.css = siteStats_default;
  return Component;
});
var SiteStats_default = SiteStats;

// src/index.ts
var manifest = {
  name: "site-stats",
  displayName: "Site Statistics",
  description: "Displays site uptime, online visitors, unique visitors, and page views.",
  category: "component",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  dependencies: [],
  defaultOrder: 45,
  defaultEnabled: true,
  defaultOptions: {
    siteStartedAt: "2026-08-23T00:00:00+08:00",
    endpoint: "/api/site-stats"
  },
  components: {
    SiteStats: {
      name: "SiteStats",
      displayName: "Site Statistics",
      description: "Compact live site statistics for the footer.",
      version: "0.1.0",
      defaultPosition: "footer",
      defaultPriority: 40
    }
  }
};

export { SiteStats_default as SiteStats, manifest };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map