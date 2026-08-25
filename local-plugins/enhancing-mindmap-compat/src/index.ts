import type { Heading, Root } from "mdast"
import { toString } from "mdast-util-to-string"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { parse as parseYaml } from "yaml"

export interface EnhancingMindmapOptions {
  frontmatterKey: string
  frontmatterValue: string
  rootLabel: string
}

const defaultOptions: EnhancingMindmapOptions = {
  frontmatterKey: "mindmap-plugin",
  frontmatterValue: "basic",
  rootLabel: "思维导图",
}

const frontmatterPattern = /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/
const markdownParser = unified().use(remarkParse)

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeMarker(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase()
}

function cleanHeadingLabel(heading: Heading): string {
  return toString(heading)
    .replace(/!\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeMermaidLabel(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function headingsToMermaid(
  headings: Heading[],
  options: EnhancingMindmapOptions,
): string | undefined {
  const firstHeading = headings[0]
  if (!firstHeading) return undefined

  const firstLabel = cleanHeadingLabel(firstHeading)
  const marker = `${options.frontmatterKey}: ${options.frontmatterValue}`
  const firstIsMarker = normalizeMarker(firstLabel) === normalizeMarker(marker)
  const rootLabel = firstIsMarker ? options.rootLabel : firstLabel || options.rootLabel
  const childHeadings = headings.slice(1)
  const lines = ["mindmap", `  root["${escapeMermaidLabel(rootLabel)}"]`]
  const ancestorDepths: number[] = []

  for (const [index, heading] of childHeadings.entries()) {
    while (
      ancestorDepths.length > 0 &&
      ancestorDepths[ancestorDepths.length - 1]! >= heading.depth
    ) {
      ancestorDepths.pop()
    }

    const label = cleanHeadingLabel(heading) || "未命名节点"
    const indentation = "  ".repeat(ancestorDepths.length + 2)
    lines.push(`${indentation}node${index + 1}["${escapeMermaidLabel(label)}"]`)
    ancestorDepths.push(heading.depth)
  }

  return lines.join("\n")
}

export function transformEnhancingMindmap(
  source: string,
  userOptions: Partial<EnhancingMindmapOptions> = {},
): string {
  const options = { ...defaultOptions, ...userOptions }
  const frontmatterMatch = source.match(frontmatterPattern)
  if (!frontmatterMatch) return source

  let frontmatter: unknown
  try {
    frontmatter = parseYaml(frontmatterMatch[1] ?? "")
  } catch {
    return source
  }

  if (!isRecord(frontmatter)) return source
  const markerValue = frontmatter[options.frontmatterKey]
  if (
    typeof markerValue !== "string" ||
    markerValue.trim().toLowerCase() !== options.frontmatterValue.toLowerCase()
  ) {
    return source
  }

  const body = source.slice(frontmatterMatch[0].length)
  const tree = markdownParser.parse(body) as Root
  const headings = tree.children.filter((node): node is Heading => node.type === "heading")
  const mermaid = headingsToMermaid(headings, options)
  if (!mermaid) return source

  const preservedFrontmatter = frontmatterMatch[0].trimEnd()
  return `${preservedFrontmatter}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`
}

const EnhancingMindmapCompat: QuartzTransformerPlugin<Partial<EnhancingMindmapOptions>> = (
  userOptions,
) => ({
  name: "EnhancingMindmapCompat",
  textTransform(_ctx, source) {
    return transformEnhancingMindmap(source, userOptions)
  },
})

export default EnhancingMindmapCompat
