import { diffChars, diffLines, type Change } from 'diff'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import type { DiffPart } from '#shared/types/article'
import { extractNodeText } from './tiptap-node-text'

// リビジョン差分専用のプレーンテキスト抽出。段落・見出し単位で改行を保持する。
// FTS5用のbody_text抽出（tiptap-text.ts）とはノード走査ロジック（tiptap-node-text.ts）を
// 共有しつつ、改行の挟み方の目的が異なるため関数は分離している（architecture.md §6.2）。
export function extractRevisionText(doc: TiptapNode): string {
  return (doc.content ?? []).map(extractNodeText).join('\n')
}

function toParts(changes: Change[]): DiffPart[] {
  return changes.map(c => ({
    type: c.added ? 'added' : c.removed ? 'removed' : 'equal',
    value: c.value,
  }))
}

// タイトル・概要文は短い文字列のため文字単位で比較する（日本語は単語境界の概念がないため diffWords は使わない）。
export function diffPlainText(before: string, after: string): DiffPart[] {
  return toParts(diffChars(before, after))
}

// 本文は段落（改行）単位のテキスト差分とする（spec-article-editing.md §4.8, architecture.md §6.2）。
export function diffBodyText(before: string, after: string): DiffPart[] {
  return toParts(diffLines(before, after))
}
