import { eq } from 'drizzle-orm'
import type { AdminArticleDetail } from '#shared/types/article'
import { articles } from '../../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const db = useDrizzle(event)

  const row = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    with: { articleTags: { with: { tag: true } } },
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  const article: AdminArticleDetail = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    bodyJson: JSON.parse(row.bodyJson),
    status: row.status as AdminArticleDetail['status'],
    publishedAt: row.publishedAt,
    coverImageId: row.coverImageId,
    tagNames: row.articleTags.map(at => at.tag.name),
  }

  return article
})
