import { and, eq, sql } from 'drizzle-orm'
import { articles } from '../../database/schema'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug') as string
  const db = useDrizzle(event)

  const row = await db.query.articles.findFirst({
    where: and(
      eq(articles.slug, slug),
      eq(articles.status, 'published'),
      sql`datetime(${articles.publishedAt}) <= datetime('now')`
    ),
    columns: { title: true },
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return renderOgImageResponse(event, row.title)
})
