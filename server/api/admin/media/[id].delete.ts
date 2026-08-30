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

  // 記事からの参照有無は事前チェックしない（spec-media.md §8決定事項）が、
  // 参照中の行はFOREIGN KEY制約で削除自体が失敗する。R2を先に消すと、この場合に
  // 実ファイルだけ復元不能に失われDB行は参照切れのまま残ってしまうため、
  // D1を先に削除し成功した場合のみR2から削除する。
  try {
    await db.delete(media).where(eq(media.id, id))
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Media is still referenced by an article',
      })
    }
    throw err
  }
  await r2.delete(row.r2Key)

  setResponseStatus(event, 204)
  return null
})
