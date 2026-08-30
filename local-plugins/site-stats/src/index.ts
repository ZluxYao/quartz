export { default as SiteStats, type SiteStatsOptions } from "./components/SiteStats"

export type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  StringResource,
} from "./types"

export const manifest = {
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
    endpoint: "/api/site-stats",
  },
  components: {
    SiteStats: {
      name: "SiteStats",
      displayName: "Site Statistics",
      description: "Compact live site statistics for the footer.",
      version: "0.1.0",
      defaultPosition: "footer",
      defaultPriority: 40,
    },
  },
} as const
