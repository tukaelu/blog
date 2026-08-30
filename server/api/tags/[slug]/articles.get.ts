import { z } from 'zod'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import type { ArticleSummary, Pagination } from '#shared/types/article'
import { articles, articleTags, tags } from '../../../database/schema'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})

const LIMIT = 10

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug') as string
  const { page } = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle(event)
  const offset = (page - 1) * LIMIT

  const tag = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .where(eq(tags.slug, slug))
    .get()
  if (!tag) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const taggedArticleIds = db
    .select({ id: articleTags.articleId })
    .from(articleTags)
    .where(eq(articleTags.tagId, tag.id))

  const condition = and(
    inArray(articles.id, taggedArticleIds),
    eq(articles.status, 'published'),
    sql`datetime(${articles.publishedAt}) <= datetime('now')`
  )

  const rows = await db.query.articles.findMany({
    where: condition,
    orderBy: desc(articles.publishedAt),
    limit: LIMIT,
    offset,
    with: { coverImage: true, articleTags: { with: { tag: true } } },
  })

  const totalRow = await db
    .select({ total: count() })
    .from(articles)
    .where(condition)
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
    totalPages: Math.max(1, Math.ceil(total / LIMIT)),
    totalCount: total,
  }

  return {
    tag: { name: tag.name, slug: tag.slug },
    articles: articleList,
    pagination,
  }
})
