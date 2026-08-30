export { Q as QuartzComponent, a as QuartzComponentConstructor, b as QuartzComponentProps, S as SiteStats, c as SiteStatsOptions, d as StringResource } from './index-2dMZyzH3.js';
import 'preact';

declare const manifest: {
    readonly name: "site-stats";
    readonly displayName: "Site Statistics";
    readonly description: "Displays site uptime, online visitors, unique visitors, and page views.";
    readonly category: "component";
    readonly version: "0.1.0";
    readonly quartzVersion: ">=5.0.0";
    readonly dependencies: readonly [];
    readonly defaultOrder: 45;
    readonly defaultEnabled: true;
    readonly defaultOptions: {
        readonly siteStartedAt: "2026-08-23T00:00:00+08:00";
        readonly endpoint: "/api/site-stats";
    };
    readonly components: {
        readonly SiteStats: {
            readonly name: "SiteStats";
            readonly displayName: "Site Statistics";
            readonly description: "Compact live site statistics for the footer.";
            readonly version: "0.1.0";
            readonly defaultPosition: "footer";
            readonly defaultPriority: 40;
        };
    };
};

export { manifest };
