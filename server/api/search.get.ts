import { z } from 'zod'
import { sql } from 'drizzle-orm'

const querySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
})

const LIMIT = 10

interface SearchRow {
  slug: string
  title: string
  published_at: string
  snippet: string
}

// articles_fts は仮想テーブルのためDrizzleのスキーマビルダーで表現できず、
// sqlテンプレート（パラメータは自動バインドされる）で操作する（server/utils/search-index.ts参照）。
// 列順は article_id(0, UNINDEXED) / title(1) / body_text(2)。snippet()はbody_textから生成する。
export default defineEventHandler(async event => {
  const { q, page } = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle(event)
  const offset = (page - 1) * LIMIT
  const ftsQuery = buildFtsQuery(q)

  const results = await db.all<SearchRow>(sql`
    SELECT a.slug, a.title, a.published_at,
      snippet(articles_fts, 2, '<mark>', '</mark>', '...', 10) AS snippet
    FROM articles_fts
    JOIN articles a ON a.id = articles_fts.article_id
    WHERE articles_fts MATCH ${ftsQuery} AND a.status = 'published' AND datetime(a.published_at) <= datetime('now')
    ORDER BY bm25(articles_fts)
    LIMIT ${LIMIT} OFFSET ${offset}
  `)

  const totalRow = await db.get<{ total: number }>(sql`
    SELECT COUNT(*) AS total
    FROM articles_fts
    JOIN articles a ON a.id = articles_fts.article_id
    WHERE articles_fts MATCH ${ftsQuery} AND a.status = 'published' AND datetime(a.published_at) <= datetime('now')
  `)
  const total = totalRow?.total ?? 0

  return {
    query: q,
    results: results.map(row => ({
      slug: row.slug,
      title: row.title,
      snippet: row.snippet,
      publishedAt: row.published_at,
    })),
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(total / LIMIT)),
      totalCount: total,
    },
  }
})
