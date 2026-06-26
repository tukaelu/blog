import { desc, eq } from 'drizzle-orm'
import { articleRevisions } from '../../../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const db = useDrizzle(event)

  const results = await db
    .select({
      id: articleRevisions.id,
      revisionNo: articleRevisions.revisionNo,
      title: articleRevisions.title,
      status: articleRevisions.status,
      createdAt: articleRevisions.createdAt,
      revertOf: articleRevisions.revertOf,
    })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, id))
    .orderBy(desc(articleRevisions.revisionNo))

  return { revisions: results }
})
