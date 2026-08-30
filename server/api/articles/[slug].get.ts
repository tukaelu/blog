import { and, count, eq, sql } from 'drizzle-orm'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import type { ArticleDetail } from '#shared/types/article'
import { articles, likes } from '../../database/schema'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug') as string
  const db = useDrizzle(event)

  const row = await db.query.articles.findFirst({
    where: and(
      eq(articles.slug, slug),
      eq(articles.status, 'published'),
      sql`datetime(${articles.publishedAt}) <= datetime('now')`
    ),
    with: { articleTags: { with: { tag: true } } },
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  const likeRow = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, row.id))
    .get()

  const bodyJson: TiptapNode = JSON.parse(row.bodyJson)

  const article: ArticleDetail = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    bodyJson,
    toc: buildToc(bodyJson),
    footnotes: extractFootnotes(bodyJson),
    publishedAt: row.publishedAt as string,
    readingTimeMinutes: calcReadingTimeMinutes(row.bodyText),
    likeCount: likeRow?.count ?? 0,
    tags: toArticleTags(row.articleTags),
  }

  return article
})
