import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import siteStatsScript from "./scripts/siteStats.inline.ts?raw"
import styles from "./styles/siteStats.scss"

export interface SiteStatsOptions {
  readonly siteStartedAt?: string
  readonly endpoint?: string
}

const DEFAULT_OPTIONS = {
  siteStartedAt: "2026-08-23T00:00:00+08:00",
  endpoint: "/api/site-stats",
} as const

function normalizeOptions(options?: SiteStatsOptions) {
  const siteStartedAt = options?.siteStartedAt ?? DEFAULT_OPTIONS.siteStartedAt
  const endpoint = options?.endpoint ?? DEFAULT_OPTIONS.endpoint

  if (Number.isNaN(Date.parse(siteStartedAt))) {
    throw new Error(`Invalid siteStartedAt value: ${siteStartedAt}`)
  }
  if (!endpoint.startsWith("/")) {
    throw new Error(`Site statistics endpoint must start with "/": ${endpoint}`)
  }

  return { siteStartedAt, endpoint }
}

const SiteStats = ((options?: SiteStatsOptions): QuartzComponent => {
  const normalized = normalizeOptions(options)
  const Component: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const classes = displayClass ? `${displayClass} site-stats` : "site-stats"
    const isChinese = cfg.locale.startsWith("zh")
    const labels = isChinese
      ? {
          uptime: "本站已运行",
          days: "天",
          online: "当前在线",
          people: "人",
          visitors: "总访客",
          views: "总浏览",
          times: "次",
        }
      : {
          uptime: "Online for",
          days: "days",
          online: "Online",
          people: "visitors",
          visitors: "Total visitors",
          views: "Page views",
          times: "views",
        }

    return (
      <div
        class={classes}
        data-site-stats
        data-site-started-at={normalized.siteStartedAt}
        data-site-stats-endpoint={normalized.endpoint}
        aria-live="polite"
      >
        <span class="site-stat">
          <span>{labels.uptime}</span>
          <strong data-site-stat="uptime">--</strong>
          <span>{labels.days}</span>
        </span>
        <span class="site-stat">
          <span>{labels.online}</span>
          <strong data-site-stat="online">--</strong>
          <span>{labels.people}</span>
        </span>
        <span class="site-stat">
          <span>{labels.visitors}</span>
          <strong data-site-stat="visitors">--</strong>
          <span>{labels.people}</span>
        </span>
        <span class="site-stat">
          <span>{labels.views}</span>
          <strong data-site-stat="views">--</strong>
          <span>{labels.times}</span>
        </span>
      </div>
    )
  }

  Component.afterDOMLoaded = siteStatsScript
  Component.css = styles
  return Component
}) satisfies QuartzComponentConstructor<SiteStatsOptions>

export default SiteStats
