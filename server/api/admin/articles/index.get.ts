import { z } from 'zod'
import { count, desc, eq, inArray } from 'drizzle-orm'
import type { AdminArticleSummary, Pagination } from '#shared/types/article'
import { articles, likes } from '../../../database/schema'

const querySchema = z.object({
  status: z.enum(['draft', 'published', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export default defineEventHandler(async event => {
  const { status, page, limit } = await getValidatedQuery(
    event,
    querySchema.parse
  )
  const db = useDrizzle(event)
  const offset = (page - 1) * limit
  const condition = status === 'all' ? undefined : eq(articles.status, status)

  const rows = await db.query.articles.findMany({
    where: condition,
    orderBy: desc(articles.updatedAt),
    limit,
    offset,
    with: { articleTags: { with: { tag: true } } },
  })

  const totalRow = await db
    .select({ total: count() })
    .from(articles)
    .where(condition)
    .get()
  const total = totalRow?.total ?? 0

  // 記事ごとに都度COUNTするとN+1になるため、このページ分の記事IDでまとめて集計する
  const articleIds = rows.map(row => row.id)
  const likeCounts = articleIds.length
    ? await db
        .select({ articleId: likes.articleId, count: count() })
        .from(likes)
        .where(inArray(likes.articleId, articleIds))
        .groupBy(likes.articleId)
    : []
  const likeCountById = new Map(
    likeCounts.map(row => [row.articleId, row.count])
  )

  const articleList: AdminArticleSummary[] = rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as AdminArticleSummary['status'],
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    tags: row.articleTags.map(at => at.tag.name),
    characterCount: row.bodyText.length,
    likeCount: likeCountById.get(row.id) ?? 0,
  }))

  const pagination: Pagination = {
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    totalCount: total,
  }

  return { articles: articleList, pagination }
})
