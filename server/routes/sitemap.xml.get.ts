import { and, eq, sql } from 'drizzle-orm'
import { SITE_URL } from '#shared/constants'
import {
  articles as articlesTable,
  tags as tagsTable,
} from '../database/schema'

function urlEntry(loc: string, lastmod?: string): string {
  return `
  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`
}

// spec-public-site.md §4.7: トップページ・全公開記事・全タグ別一覧ページを含む
// /api プレフィックスを付けないため server/routes 配下に配置する。
export default defineEventHandler(async event => {
  const db = useDrizzle(event)

  const articles = await db
    .select({ slug: articlesTable.slug, updatedAt: articlesTable.updatedAt })
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.status, 'published'),
        sql`datetime(${articlesTable.publishedAt}) <= datetime('now')`
      )
    )

  const tags = await db.select({ slug: tagsTable.slug }).from(tagsTable)

  const urls = [
    urlEntry(SITE_URL),
    ...articles.map(a => urlEntry(`${SITE_URL}/posts/${a.slug}`, a.updatedAt)),
    ...tags.map(t => urlEntry(`${SITE_URL}/tags/${t.slug}`)),
  ].join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
