import type { TiptapNode } from '#shared/types/tiptap-nodes'
import type { FootnoteItem } from '#shared/types/article'

// footnoteノードを出現順に走査し、1から連番を振る（architecture.md §4.3）。
// 同一contentの脚注が複数箇所にあっても出現順にそれぞれ別番号を振る。
export function extractFootnotes(doc: TiptapNode): FootnoteItem[] {
  const items: FootnoteItem[] = []

  function walk(node: TiptapNode) {
    if (node.type === 'footnote') {
      items.push({
        number: items.length + 1,
        content: String(node.attrs?.content ?? ''),
      })
    }
    for (const child of node.content ?? []) walk(child)
  }

  walk(doc)
  return items
}
