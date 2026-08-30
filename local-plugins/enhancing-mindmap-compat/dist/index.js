import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { parse } from 'yaml';

// src/styles/mindmap.css
var mindmap_default = 'svg .mindmap-node[class*="mindmap-level-"] rect,\nsvg .mindmap-node[class*="mindmap-level-"] path,\nsvg .mindmap-node[class*="mindmap-level-"] circle,\nsvg .mindmap-node[class*="mindmap-level-"] polygon {\n  stroke-width: 2px !important;\n}\n\nsvg .mindmap-node[class*="mindmap-level-"] text {\n  font-weight: 600;\n}\n\nsvg .mindmap-node.mindmap-level-0 rect,\nsvg .mindmap-node.mindmap-level-0 path,\nsvg .mindmap-node.mindmap-level-0 circle,\nsvg .mindmap-node.mindmap-level-0 polygon {\n  fill: #2563eb !important;\n  stroke: #1d4ed8 !important;\n}\n\nsvg .mindmap-node.mindmap-level-0 text {\n  fill: #ffffff !important;\n}\n\nsvg .mindmap-node.mindmap-level-1 rect,\nsvg .mindmap-node.mindmap-level-1 path,\nsvg .mindmap-node.mindmap-level-1 circle,\nsvg .mindmap-node.mindmap-level-1 polygon {\n  fill: #4ade80 !important;\n  stroke: #16a34a !important;\n}\n\nsvg .mindmap-node.mindmap-level-1 text {\n  fill: #052e16 !important;\n}\n\nsvg .mindmap-node.mindmap-level-2 rect,\nsvg .mindmap-node.mindmap-level-2 path,\nsvg .mindmap-node.mindmap-level-2 circle,\nsvg .mindmap-node.mindmap-level-2 polygon {\n  fill: #facc15 !important;\n  stroke: #ca8a04 !important;\n}\n\nsvg .mindmap-node.mindmap-level-2 text {\n  fill: #422006 !important;\n}\n\nsvg .mindmap-node.mindmap-level-3 rect,\nsvg .mindmap-node.mindmap-level-3 path,\nsvg .mindmap-node.mindmap-level-3 circle,\nsvg .mindmap-node.mindmap-level-3 polygon {\n  fill: #a78bfa !important;\n  stroke: #7c3aed !important;\n}\n\nsvg .mindmap-node.mindmap-level-3 text {\n  fill: #2e1065 !important;\n}\n\nsvg .mindmap-node.mindmap-level-4 rect,\nsvg .mindmap-node.mindmap-level-4 path,\nsvg .mindmap-node.mindmap-level-4 circle,\nsvg .mindmap-node.mindmap-level-4 polygon {\n  fill: #f472b6 !important;\n  stroke: #db2777 !important;\n}\n\nsvg .mindmap-node.mindmap-level-4 text {\n  fill: #500724 !important;\n}\n\nsvg .mindmap-node.mindmap-level-5 rect,\nsvg .mindmap-node.mindmap-level-5 path,\nsvg .mindmap-node.mindmap-level-5 circle,\nsvg .mindmap-node.mindmap-level-5 polygon {\n  fill: #22d3ee !important;\n  stroke: #0891b2 !important;\n}\n\nsvg .mindmap-node.mindmap-level-5 text {\n  fill: #083344 !important;\n}\n\nsvg .mindmap-node.mindmap-level-6 rect,\nsvg .mindmap-node.mindmap-level-6 path,\nsvg .mindmap-node.mindmap-level-6 circle,\nsvg .mindmap-node.mindmap-level-6 polygon {\n  fill: #fb923c !important;\n  stroke: #ea580c !important;\n}\n\nsvg .mindmap-node.mindmap-level-6 text {\n  fill: #431407 !important;\n}\n\nsvg .mindmap-node.mindmap-level-7 rect,\nsvg .mindmap-node.mindmap-level-7 path,\nsvg .mindmap-node.mindmap-level-7 circle,\nsvg .mindmap-node.mindmap-level-7 polygon {\n  fill: #2dd4bf !important;\n  stroke: #0d9488 !important;\n}\n\nsvg .mindmap-node.mindmap-level-7 text {\n  fill: #042f2e !important;\n}\n\nsvg .mindmap-edges .edge-depth-0 {\n  stroke: #16a34a !important;\n}\n\nsvg .mindmap-edges .edge-depth-1 {\n  stroke: #ca8a04 !important;\n}\n\nsvg .mindmap-edges .edge-depth-2 {\n  stroke: #7c3aed !important;\n}\n\nsvg .mindmap-edges .edge-depth-3 {\n  stroke: #db2777 !important;\n}\n\nsvg .mindmap-edges .edge-depth-4 {\n  stroke: #0891b2 !important;\n}\n\nsvg .mindmap-edges .edge-depth-5 {\n  stroke: #ea580c !important;\n}\n\nsvg .mindmap-edges .edge-depth-6,\nsvg .mindmap-edges .edge-depth-7 {\n  stroke: #0d9488 !important;\n}\n';
var defaultOptions = {
  frontmatterKey: "mindmap-plugin",
  frontmatterValue: "basic",
  rootLabel: "\u601D\u7EF4\u5BFC\u56FE"
};
var frontmatterPattern = /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/;
var markdownParser = unified().use(remarkParse);
var mermaidFencePattern = /(^[\t ]*(`{3,}|~{3,})[\t ]*mermaid(?:[\t ][^\r\n]*)?\r?\n)([\s\S]*?)(^[\t ]*\2[\t ]*$)/gim;
var maxMindmapLevel = 7;
function indentationWidth(line) {
  const indentation = line.match(/^[\t ]*/)?.[0] ?? "";
  return [...indentation].reduce((width, character) => width + (character === "	" ? 2 : 1), 0);
}
function isMindmapDecoration(line) {
  const trimmed = line.trim();
  return trimmed.length === 0 || trimmed.startsWith("%%") || trimmed.startsWith(":::") || trimmed.startsWith("::icon(");
}
function decorateMindmapDefinition(definition) {
  const newline = definition.includes("\r\n") ? "\r\n" : "\n";
  const lines = definition.split(/\r?\n/);
  const mindmapLineIndex = lines.findIndex((line) => /^mindmap(?:\s|$)/i.test(line.trim()));
  if (mindmapLineIndex < 0) return definition;
  const nodeLineIndexes = [];
  for (let index = mindmapLineIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    if (!isMindmapDecoration(line)) nodeLineIndexes.push(index);
  }
  if (nodeLineIndexes.length === 0) return definition;
  const indentationLevels = [
    ...new Set(nodeLineIndexes.map((index) => indentationWidth(lines[index])))
  ].sort((left, right) => left - right);
  const replacements = /* @__PURE__ */ new Map();
  const decorations = /* @__PURE__ */ new Map();
  for (const [nodeIndex, lineIndex] of nodeLineIndexes.entries()) {
    const line = lines[lineIndex];
    const indentation = line.match(/^[\t ]*/)?.[0] ?? "";
    const rawLevel = indentationLevels.indexOf(indentationWidth(line));
    const className = `mindmap-level-${Math.min(Math.max(rawLevel, 0), maxMindmapLevel)}`;
    const nextNodeLineIndex = nodeLineIndexes[nodeIndex + 1] ?? lines.length;
    let existingClassLineIndex;
    for (let index = lineIndex + 1; index < nextNodeLineIndex; index++) {
      if (lines[index].trim().startsWith(":::")) {
        existingClassLineIndex = index;
        break;
      }
    }
    if (existingClassLineIndex !== void 0) {
      const classLine = lines[existingClassLineIndex];
      if (!classLine.includes(className)) {
        replacements.set(existingClassLineIndex, `${classLine.trimEnd()} ${className}`);
      }
    } else {
      decorations.set(lineIndex, `${indentation}:::${className}`);
    }
  }
  const decoratedLines = [];
  for (const [index, line] of lines.entries()) {
    decoratedLines.push(replacements.get(index) ?? line);
    const decoration = decorations.get(index);
    if (decoration) decoratedLines.push(decoration);
  }
  return decoratedLines.join(newline);
}
function decorateMermaidMindmaps(source) {
  return source.replace(
    mermaidFencePattern,
    (_match, opening, _fence, definition, closing) => `${opening}${decorateMindmapDefinition(definition)}${closing}`
  );
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normalizeMarker(value) {
  return value.replace(/\s+/g, "").toLowerCase();
}
function cleanHeadingLabel(heading) {
  return toString(heading).replace(/!\[\[([^\]]+)\]\]/g, "$1").replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1").replace(/\s+/g, " ").trim();
}
function escapeMermaidLabel(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function headingsToMermaid(headings, options) {
  const firstHeading = headings[0];
  if (!firstHeading) return void 0;
  const firstLabel = cleanHeadingLabel(firstHeading);
  const marker = `${options.frontmatterKey}: ${options.frontmatterValue}`;
  const firstIsMarker = normalizeMarker(firstLabel) === normalizeMarker(marker);
  const rootLabel = firstIsMarker ? options.rootLabel : firstLabel || options.rootLabel;
  const childHeadings = headings.slice(1);
  const lines = ["mindmap", `  root["${escapeMermaidLabel(rootLabel)}"]`];
  const ancestorDepths = [];
  for (const [index, heading] of childHeadings.entries()) {
    while (ancestorDepths.length > 0 && ancestorDepths[ancestorDepths.length - 1] >= heading.depth) {
      ancestorDepths.pop();
    }
    const label = cleanHeadingLabel(heading) || "\u672A\u547D\u540D\u8282\u70B9";
    const indentation = "  ".repeat(ancestorDepths.length + 2);
    lines.push(`${indentation}node${index + 1}["${escapeMermaidLabel(label)}"]`);
    ancestorDepths.push(heading.depth);
  }
  return lines.join("\n");
}
function transformEnhancingMindmap(source, userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const frontmatterMatch = source.match(frontmatterPattern);
  if (!frontmatterMatch) return decorateMermaidMindmaps(source);
  let frontmatter;
  try {
    frontmatter = parse(frontmatterMatch[1] ?? "");
  } catch {
    return decorateMermaidMindmaps(source);
  }
  if (!isRecord(frontmatter)) return decorateMermaidMindmaps(source);
  const markerValue = frontmatter[options.frontmatterKey];
  if (typeof markerValue !== "string" || markerValue.trim().toLowerCase() !== options.frontmatterValue.toLowerCase()) {
    return decorateMermaidMindmaps(source);
  }
  const body = source.slice(frontmatterMatch[0].length);
  const tree = markdownParser.parse(body);
  const headings = tree.children.filter((node) => node.type === "heading");
  const mermaid = headingsToMermaid(headings, options);
  if (!mermaid) return decorateMermaidMindmaps(source);
  const preservedFrontmatter = frontmatterMatch[0].trimEnd();
  return decorateMermaidMindmaps(`${preservedFrontmatter}

\`\`\`mermaid
${mermaid}
\`\`\`
`);
}

// src/index.ts
var EnhancingMindmapCompat = (userOptions) => ({
  name: "EnhancingMindmapCompat",
  textTransform(_ctx, source) {
    return transformEnhancingMindmap(source, userOptions);
  },
  externalResources() {
    return {
      css: [{ content: mindmap_default, inline: true, spaPreserve: true }]
    };
  }
});
var index_default = EnhancingMindmapCompat;

export { decorateMermaidMindmaps, decorateMindmapDefinition, index_default as default, headingsToMermaid, transformEnhancingMindmap };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map