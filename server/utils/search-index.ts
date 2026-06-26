import { sql } from 'drizzle-orm'
import type { AppDatabase } from './db'

// 日本語検索精度向上のため Intl.Segmenter で分かち書きしたテキストをFTS5の索引対象にする（architecture.md §9）。
export function segmentJapanese(text: string): string {
  const segmenter = new Intl.Segmenter('ja', { granularity: 'word' })
  return Array.from(segmenter.segment(text))
    .map(s => s.segment.trim())
    .filter(Boolean)
    .join(' ')
}

// articles_fts は仮想テーブルのためDrizzleのスキーマビルダーで表現できず、
// sqlテンプレート（パラメータは自動バインドされる）で操作する（migrations/0001_fts5_articles_search.sql参照）。
// 独立したFTS5テーブルとし、articlesとの同期はアプリケーション側（記事保存/削除API）で明示的に行う
// （外部コンテンツテーブル方式は元テーブル更新時の同期にトリガーが必須になるため採らない）。
export async function indexArticle(
  db: AppDatabase,
  articleId: string,
  title: string,
  bodyText: string
): Promise<void> {
  await db.run(sql`DELETE FROM articles_fts WHERE article_id = ${articleId}`)
  await db.run(
    sql`INSERT INTO articles_fts (article_id, title, body_text) VALUES (${articleId}, ${segmentJapanese(title)}, ${segmentJapanese(bodyText)})`
  )
}

export async function removeArticleFromIndex(
  db: AppDatabase,
  articleId: string
): Promise<void> {
  await db.run(sql`DELETE FROM articles_fts WHERE article_id = ${articleId}`)
}

// ユーザーの検索語を分かち書きし、FTS5のフレーズ構文でエスケープしたAND検索クエリを組み立てる
// （ユーザー入力をそのままMATCH式に渡すとFTS5クエリ構文として解釈され、構文エラーやインジェクションの原因になるため）。
export function buildFtsQuery(text: string): string {
  const tokens = segmentJapanese(text).split(' ').filter(Boolean)
  return tokens.map(t => `"${t.replace(/"/g, '""')}"`).join(' ')
}
