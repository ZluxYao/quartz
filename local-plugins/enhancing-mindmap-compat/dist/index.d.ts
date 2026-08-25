import { Heading } from 'mdast';
import { QuartzTransformerPlugin } from '@quartz-community/types';

interface EnhancingMindmapOptions {
    frontmatterKey: string;
    frontmatterValue: string;
    rootLabel: string;
}
declare function headingsToMermaid(headings: Heading[], options: EnhancingMindmapOptions): string | undefined;
declare function transformEnhancingMindmap(source: string, userOptions?: Partial<EnhancingMindmapOptions>): string;
declare const EnhancingMindmapCompat: QuartzTransformerPlugin<Partial<EnhancingMindmapOptions>>;

export { type EnhancingMindmapOptions, EnhancingMindmapCompat as default, headingsToMermaid, transformEnhancingMindmap };
