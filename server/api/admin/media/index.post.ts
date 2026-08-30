import { imageSize } from 'image-size'
import { media } from '../../../database/schema'

export default defineEventHandler(async event => {
  const db = useDrizzle(event)
  const r2 = useR2(event)

  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'file')
  if (!file || !file.type) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' })
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number]
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: '対応していないファイル形式です（JPEG/PNG/WebP/GIFのみ）',
    })
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ファイルサイズが上限（10MB）を超えています',
    })
  }

  let width: number | null = null
  let height: number | null = null
  try {
    const size = imageSize(file.data)
    width = size.width
    height = size.height
  } catch {
    // ヘッダーからのサイズ抽出に失敗しても、アップロード自体は継続する
  }

  const id = crypto.randomUUID()
  const r2Key = `media/${id}.${extensionForMime(file.type)}`

  await r2.put(r2Key, file.data, { httpMetadata: { contentType: file.type } })

  const createdAt = new Date().toISOString()
  try {
    await db.insert(media).values({
      id,
      r2Key,
      mimeType: file.type,
      width,
      height,
      createdAt,
    })
  } catch (err) {
    // メタデータ登録に失敗した場合、R2オブジェクトだけが孤立して残らないようにする
    await r2.delete(r2Key)
    throw err
  }

  setResponseStatus(event, 201)
  return {
    id,
    r2Key,
    mimeType: file.type,
    width,
    height,
    url: mediaUrl(r2Key),
    createdAt,
  }
})
