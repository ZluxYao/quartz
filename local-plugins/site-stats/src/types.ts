import type { ComponentChild } from "preact"

export type StringResource = string | string[]

export interface QuartzComponentProps {
  readonly cfg: {
    readonly locale: string
  }
  readonly displayClass?: "mobile-only" | "desktop-only" | string
  readonly [key: string]: unknown
}

export type QuartzComponent = ((props: QuartzComponentProps) => ComponentChild) & {
  displayName?: string
  css?: StringResource
  beforeDOMLoaded?: StringResource
  afterDOMLoaded?: StringResource
}

export type QuartzComponentConstructor<Options extends object | undefined = undefined> = (
  options?: Options,
) => QuartzComponent
