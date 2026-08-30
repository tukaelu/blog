import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { extractNodeText } from './tiptap-node-text'

// FTS5索引対象の body_text を生成する。ブロックノード単位で改行を挟む（architecture.md §3.3）。
// リビジョン差分用のテキスト抽出（revision-diff.ts）とは改行の挟み方の目的が異なるため
// 関数を分けているが、ノード走査ロジック自体はtiptap-node-text.tsを共有する。
export function extractPlainText(doc: TiptapNode): string {
  return (doc.content ?? []).map(extractNodeText).join('\n')
}
