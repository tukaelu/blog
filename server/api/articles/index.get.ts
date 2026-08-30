import { z } from 'zod'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import type { ArticleSummary, Pagination } from '#shared/types/article'
import { articles } from '../../database/schema'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export default defineEventHandler(async event => {
  const { page, limit } = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle(event)
  const offset = (page - 1) * limit

  const publishedCondition = and(
    eq(articles.status, 'published'),
    sql`datetime(${articles.publishedAt}) <= datetime('now')`
  )

  const rows = await db.query.articles.findMany({
    where: publishedCondition,
    orderBy: desc(articles.publishedAt),
    limit,
    offset,
    with: { coverImage: true, articleTags: { with: { tag: true } } },
  })

  const totalRow = await db
    .select({ total: count() })
    .from(articles)
    .where(publishedCondition)
    .get()
  const total = totalRow?.total ?? 0

  const articleList: ArticleSummary[] = rows.map(
    (row): ArticleSummary => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      publishedAt: row.publishedAt as string,
      readingTimeMinutes: calcReadingTimeMinutes(row.bodyText),
      tags: toArticleTags(row.articleTags),
      coverImageUrl: row.coverImage?.r2Key
        ? transformedMediaUrl(
            row.coverImage.r2Key,
            'width=400,quality=85,format=auto'
          )
        : null,
    })
  )

  const pagination: Pagination = {
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    totalCount: total,
  }

  return { articles: articleList, pagination }
})
