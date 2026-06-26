import { and, eq } from 'drizzle-orm'
import { articleRevisions } from '../../../../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const revisionId = getRouterParam(event, 'revisionId') as string
  const db = useDrizzle(event)

  const row = await db
    .select()
    .from(articleRevisions)
    .where(
      and(
        eq(articleRevisions.id, revisionId),
        eq(articleRevisions.articleId, id)
      )
    )
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  }

  return {
    id: row.id,
    revisionNo: row.revisionNo,
    title: row.title,
    description: row.description,
    bodyJson: JSON.parse(row.bodyJson),
    status: row.status,
    publishedAt: row.publishedAt,
    revertOf: row.revertOf,
    createdAt: row.createdAt,
  }
})
