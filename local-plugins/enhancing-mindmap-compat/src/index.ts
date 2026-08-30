import type { QuartzTransformerPlugin } from "@quartz-community/types"
import mindmapStyles from "./styles/mindmap.css"
import { transformEnhancingMindmap, type EnhancingMindmapOptions } from "./transform"

export * from "./transform"

const EnhancingMindmapCompat: QuartzTransformerPlugin<Partial<EnhancingMindmapOptions>> = (
  userOptions,
) => ({
  name: "EnhancingMindmapCompat",
  textTransform(_ctx, source) {
    return transformEnhancingMindmap(source, userOptions)
  },
  externalResources() {
    return {
      css: [{ content: mindmapStyles, inline: true, spaPreserve: true }],
    }
  },
})

export default EnhancingMindmapCompat
