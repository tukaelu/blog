import { z } from 'zod'

// 独自ノード（linkCard/embed/mermaid/footnote）はフェーズ4で追加する。
// 現時点では基本ノードのみを型として扱い、未知の type はレンダラー側でフォールバック表示する。
export interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
}

const tiptapMarkSchema: z.ZodType<TiptapMark> = z.object({
  type: z.string(),
  attrs: z.record(z.string(), z.unknown()).optional(),
})

export const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(tiptapNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(tiptapMarkSchema).optional(),
  })
)

export const tiptapDocSchema = tiptapNodeSchema.refine(
  node => node.type === 'doc',
  { message: 'root node must be type "doc"' }
)

export interface TocItem {
  level: number
  text: string
  anchor: string
}
