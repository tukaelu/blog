import type { TiptapNode } from '#shared/types/tiptap-nodes'

function extractNodeText(node: TiptapNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(extractNodeText).join('')
}

// FTS5索引対象の body_text を生成する。ブロックノード単位で改行を挟む（architecture.md §3.3）。
// リビジョン差分用のテキスト抽出とは目的が異なるため関数を分けている（architecture.md §6.2）。
export function extractPlainText(doc: TiptapNode): string {
  return (doc.content ?? []).map(extractNodeText).join('\n')
}
