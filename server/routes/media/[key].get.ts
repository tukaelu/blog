// 公開・認証不要の画像配信エンドポイント（spec-media.md §4.4）。
// /api プレフィックスを付けないため server/routes 配下に配置する。
export default defineEventHandler(async event => {
  const key = getRouterParam(event, 'key') as string
  const r2 = useR2(event)

  const object = await r2.get(`media/${key}`)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }

  setHeader(
    event,
    'Content-Type',
    object.httpMetadata?.contentType ?? 'application/octet-stream'
  )
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return object.body
})
