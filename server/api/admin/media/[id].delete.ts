import { eq } from 'drizzle-orm'
import { media } from '../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const db = useDrizzle(event)
  const r2 = useR2(event)

  const row = await db
    .select({ r2Key: media.r2Key })
    .from(media)
    .where(eq(media.id, id))
    .get()
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }

  // 記事からの参照有無はチェックしない（spec-media.md §8決定事項）
  await r2.delete(row.r2Key)
  await db.delete(media).where(eq(media.id, id))

  setResponseStatus(event, 204)
  return null
})
