import { sql } from 'drizzle-orm'
import type { AppDatabase } from './db'

interface RevisionSource {
  id: string
  title: string
  description: string | null
  bodyJson: string
  status: string
  publishedAt: string | null
}

// 明示的保存（下書き保存/公開）の都度スナップショットを1件追加する（spec-article-editing.md §6.3）。
// revision_noの採番はSELECT MAX→INSERTを別々に行うと同時保存時にレースが起きる
// （unique(article_id, revision_no)違反で500になる）ため、
// サブクエリでのMAX取得とINSERTを1つのSQL文にまとめて原子的に行う
// （tags.tsのON CONFLICT DO NOTHINGと同じ「1文にまとめる」方針）。
export async function createRevision(
  db: AppDatabase,
  article: RevisionSource,
  revertOf: string | null = null
): Promise<{ id: string; revisionNo: number }> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const row = await db.get<{ revision_no: number }>(sql`
    INSERT INTO article_revisions
      (id, article_id, revision_no, title, description, body_json, status, published_at, revert_of, created_at)
    VALUES (
      ${id},
      ${article.id},
      (SELECT COALESCE(MAX(revision_no), 0) + 1 FROM article_revisions WHERE article_id = ${article.id}),
      ${article.title},
      ${article.description},
      ${article.bodyJson},
      ${article.status},
      ${article.publishedAt},
      ${revertOf},
      ${now}
    )
    RETURNING revision_no
  `)

  return { id, revisionNo: row!.revision_no }
}
