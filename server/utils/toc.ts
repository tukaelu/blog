import type { TiptapNode, TocItem } from '#shared/types/tiptap-nodes'

function extractText(node: TiptapNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(extractText).join('')
}

// heading ノード（level 2〜4）から目次を組み立てる。DBには保存せず都度生成する（architecture.md §4.3）。
export function buildToc(doc: TiptapNode): TocItem[] {
  const items: TocItem[] = []
  for (const node of doc.content ?? []) {
    if (node.type !== 'heading') continue
    const level = Number(node.attrs?.level ?? 0)
    if (level < 2 || level > 4) continue
    const text = extractText(node)
    if (!text) continue
    items.push({ level, text, anchor: text })
  }
  return items
}
