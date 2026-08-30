import type { Heading, Root } from "mdast"
import { toString } from "mdast-util-to-string"
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
const mermaidFencePattern =
  /(^[\t ]*(`{3,}|~{3,})[\t ]*mermaid(?:[\t ][^\r\n]*)?\r?\n)([\s\S]*?)(^[\t ]*\2[\t ]*$)/gim
const maxMindmapLevel = 7

function indentationWidth(line: string): number {
  const indentation = line.match(/^[\t ]*/)?.[0] ?? ""
  return [...indentation].reduce((width, character) => width + (character === "\t" ? 2 : 1), 0)
}

function isMindmapDecoration(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("%%") ||
    trimmed.startsWith(":::") ||
    trimmed.startsWith("::icon(")
  )
}

export function decorateMindmapDefinition(definition: string): string {
  const newline = definition.includes("\r\n") ? "\r\n" : "\n"
  const lines = definition.split(/\r?\n/)
  const mindmapLineIndex = lines.findIndex((line) => /^mindmap(?:\s|$)/i.test(line.trim()))
  if (mindmapLineIndex < 0) return definition

  const nodeLineIndexes: number[] = []
  for (let index = mindmapLineIndex + 1; index < lines.length; index++) {
    const line = lines[index]!
    if (!isMindmapDecoration(line)) nodeLineIndexes.push(index)
  }
  if (nodeLineIndexes.length === 0) return definition

  const indentationLevels = [
    ...new Set(nodeLineIndexes.map((index) => indentationWidth(lines[index]!))),
  ].sort((left, right) => left - right)
  const replacements = new Map<number, string>()
  const decorations = new Map<number, string>()

  for (const [nodeIndex, lineIndex] of nodeLineIndexes.entries()) {
    const line = lines[lineIndex]!
    const indentation = line.match(/^[\t ]*/)?.[0] ?? ""
    const rawLevel = indentationLevels.indexOf(indentationWidth(line))
    const className = `mindmap-level-${Math.min(Math.max(rawLevel, 0), maxMindmapLevel)}`
    const nextNodeLineIndex = nodeLineIndexes[nodeIndex + 1] ?? lines.length
    let existingClassLineIndex: number | undefined

    for (let index = lineIndex + 1; index < nextNodeLineIndex; index++) {
      if (lines[index]!.trim().startsWith(":::")) {
        existingClassLineIndex = index
        break
      }
    }

    if (existingClassLineIndex !== undefined) {
      const classLine = lines[existingClassLineIndex]!
      if (!classLine.includes(className)) {
        replacements.set(existingClassLineIndex, `${classLine.trimEnd()} ${className}`)
      }
    } else {
      decorations.set(lineIndex, `${indentation}:::${className}`)
    }
  }

  const decoratedLines: string[] = []
  for (const [index, line] of lines.entries()) {
    decoratedLines.push(replacements.get(index) ?? line)
    const decoration = decorations.get(index)
    if (decoration) decoratedLines.push(decoration)
  }

  return decoratedLines.join(newline)
}

export function decorateMermaidMindmaps(source: string): string {
  return source.replace(
    mermaidFencePattern,
    (_match, opening: string, _fence: string, definition: string, closing: string) =>
      `${opening}${decorateMindmapDefinition(definition)}${closing}`,
  )
}

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
  if (!frontmatterMatch) return decorateMermaidMindmaps(source)

  let frontmatter: unknown
  try {
    frontmatter = parseYaml(frontmatterMatch[1] ?? "")
  } catch {
    return decorateMermaidMindmaps(source)
  }

  if (!isRecord(frontmatter)) return decorateMermaidMindmaps(source)
  const markerValue = frontmatter[options.frontmatterKey]
  if (
    typeof markerValue !== "string" ||
    markerValue.trim().toLowerCase() !== options.frontmatterValue.toLowerCase()
  ) {
    return decorateMermaidMindmaps(source)
  }

  const body = source.slice(frontmatterMatch[0].length)
  const tree = markdownParser.parse(body) as Root
  const headings = tree.children.filter((node): node is Heading => node.type === "heading")
  const mermaid = headingsToMermaid(headings, options)
  if (!mermaid) return decorateMermaidMindmaps(source)

  const preservedFrontmatter = frontmatterMatch[0].trimEnd()
  return decorateMermaidMindmaps(`${preservedFrontmatter}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`)
}
