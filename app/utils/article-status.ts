import type { ArticleStatus } from '#shared/types/article'

export type DisplayStatus = '下書き' | '予約中' | '公開済み'

// DB上は draft/published の2値、UIでは3値に計算する（spec-article-editing.md §3.1）
export function computeDisplayStatus(
  status: ArticleStatus,
  publishedAt: string | null
): DisplayStatus {
  if (status === 'draft') return '下書き'
  if (publishedAt && new Date(publishedAt) > new Date()) return '予約中'
  return '公開済み'
}
