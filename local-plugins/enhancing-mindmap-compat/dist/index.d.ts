import { QuartzTransformerPlugin } from '@quartz-community/types';
import { Heading } from 'mdast';

interface EnhancingMindmapOptions {
    frontmatterKey: string;
    frontmatterValue: string;
    rootLabel: string;
}
declare function decorateMindmapDefinition(definition: string): string;
declare function decorateMermaidMindmaps(source: string): string;
declare function headingsToMermaid(headings: Heading[], options: EnhancingMindmapOptions): string | undefined;
declare function transformEnhancingMindmap(source: string, userOptions?: Partial<EnhancingMindmapOptions>): string;

declare const EnhancingMindmapCompat: QuartzTransformerPlugin<Partial<EnhancingMindmapOptions>>;

export { type EnhancingMindmapOptions, decorateMermaidMindmaps, decorateMindmapDefinition, EnhancingMindmapCompat as default, headingsToMermaid, transformEnhancingMindmap };
