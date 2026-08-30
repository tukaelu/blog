import type { TiptapNode } from '#shared/types/tiptap-nodes'

// atomノード（linkCard/embed/mermaid/footnote）はcontentを持たず、実体となる
// テキストはattrsに入っている。ここを読まないと、そのノードだけで構成される
// セクションの内容がFTS5索引（tiptap-text.ts）・リビジョン差分（revision-diff.ts）の
// 両方から欠落するため、ノード種別ごとに読み出す
function attrsText(node: TiptapNode): string {
  switch (node.type) {
    case 'footnote':
      return String(node.attrs?.content ?? '')
    case 'mermaid':
      return String(node.attrs?.source ?? '')
    case 'linkCard':
    case 'embed':
      return String(node.attrs?.url ?? '')
    default:
      return ''
  }
}

// tiptap-text.ts（FTS5索引用）とrevision-diff.ts（リビジョン差分用）の両方が
// 同じノード走査ロジックを必要とするため、1箇所にまとめて再利用する。
export function extractNodeText(node: TiptapNode): string {
  if (node.text) return node.text
  if (node.content?.length) return node.content.map(extractNodeText).join('')
  return attrsText(node)
}
