import { ComponentChild } from 'preact';

type StringResource = string | string[];
interface QuartzComponentProps {
    readonly cfg: {
        readonly locale: string;
    };
    readonly displayClass?: "mobile-only" | "desktop-only" | string;
    readonly [key: string]: unknown;
}
type QuartzComponent = ((props: QuartzComponentProps) => ComponentChild) & {
    displayName?: string;
    css?: StringResource;
    beforeDOMLoaded?: StringResource;
    afterDOMLoaded?: StringResource;
};
type QuartzComponentConstructor<Options extends object | undefined = undefined> = (options?: Options) => QuartzComponent;

interface SiteStatsOptions {
    readonly siteStartedAt?: string;
    readonly endpoint?: string;
}
declare const SiteStats: (options?: SiteStatsOptions) => QuartzComponent;

export { type QuartzComponent as Q, SiteStats as S, type QuartzComponentConstructor as a, type QuartzComponentProps as b, type SiteStatsOptions as c, type StringResource as d };
