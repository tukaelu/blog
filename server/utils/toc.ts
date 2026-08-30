import type { TiptapNode, TocItem } from '#shared/types/tiptap-nodes'
import { buildHeadingAnchors } from '#shared/utils/heading-anchor'

function extractText(node: TiptapNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(extractText).join('')
}

// heading ノード（level 2〜4）から目次を組み立てる。DBには保存せず都度生成する（architecture.md §4.3）。
// アンカーは同一テキストの見出しが複数あってもDOM idと一致するよう、文書内の全見出し
// （レベル問わず）を対象に重複排除する。app/components/site/NodeRenderer.vueの
// heading id付与ロジックと同じ入力（全見出しテキストの出現順配列）を渡す必要がある。
export function buildToc(doc: TiptapNode): TocItem[] {
  const headingNodes = (doc.content ?? []).filter(n => n.type === 'heading')
  const anchors = buildHeadingAnchors(headingNodes.map(extractText))

  const items: TocItem[] = []
  headingNodes.forEach((node, i) => {
    const level = Number(node.attrs?.level ?? 0)
    if (level < 2 || level > 4) return
    const text = extractText(node)
    if (!text) return
    items.push({ level, text, anchor: anchors[i] ?? text })
  })
  return items
}
