import { eq } from 'drizzle-orm'
import { articles } from '../../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const db = useDrizzle(event)

  const result = await db.delete(articles).where(eq(articles.id, id))
  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  // articles_fts は独立テーブルのためON DELETE CASCADEでは連動しない
  await removeArticleFromIndex(db, id)

  setResponseStatus(event, 204)
  return null
})
