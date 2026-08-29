import { and, desc, eq, sql } from 'drizzle-orm'
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '#shared/constants'
import { articles } from '../database/schema'

// spec-public-site.md §4.6: 公開済み記事を新しい順に最大20件配信する
// /api プレフィックスを付けないため server/routes 配下に配置する。
export default defineEventHandler(async event => {
  const db = useDrizzle(event)

  const results = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      description: articles.description,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        sql`datetime(${articles.publishedAt}) <= datetime('now')`
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(20)

  const items = results
    .map(
      row => `
    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${SITE_URL}/posts/${row.slug}</link>
      <guid>${SITE_URL}/posts/${row.slug}</guid>
      <pubDate>${new Date(row.publishedAt as string).toUTCString()}</pubDate>
      <description>${escapeXml(row.description ?? '')}</description>
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>${items}
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
