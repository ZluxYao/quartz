import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { parse } from 'yaml';

// src/index.ts
var defaultOptions = {
  frontmatterKey: "mindmap-plugin",
  frontmatterValue: "basic",
  rootLabel: "\u601D\u7EF4\u5BFC\u56FE"
};
var frontmatterPattern = /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/;
var markdownParser = unified().use(remarkParse);
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
  if (!frontmatterMatch) return source;
  let frontmatter;
  try {
    frontmatter = parse(frontmatterMatch[1] ?? "");
  } catch {
    return source;
  }
  if (!isRecord(frontmatter)) return source;
  const markerValue = frontmatter[options.frontmatterKey];
  if (typeof markerValue !== "string" || markerValue.trim().toLowerCase() !== options.frontmatterValue.toLowerCase()) {
    return source;
  }
  const body = source.slice(frontmatterMatch[0].length);
  const tree = markdownParser.parse(body);
  const headings = tree.children.filter((node) => node.type === "heading");
  const mermaid = headingsToMermaid(headings, options);
  if (!mermaid) return source;
  const preservedFrontmatter = frontmatterMatch[0].trimEnd();
  return `${preservedFrontmatter}

\`\`\`mermaid
${mermaid}
\`\`\`
`;
}
var EnhancingMindmapCompat = (userOptions) => ({
  name: "EnhancingMindmapCompat",
  textTransform(_ctx, source) {
    return transformEnhancingMindmap(source, userOptions);
  }
});
var index_default = EnhancingMindmapCompat;

export { index_default as default, headingsToMermaid, transformEnhancingMindmap };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map