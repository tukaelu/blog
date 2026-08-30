import { z } from 'zod'
import { count, desc } from 'drizzle-orm'
import { media } from '../../../database/schema'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export default defineEventHandler(async event => {
  const { page, limit } = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle(event)
  const offset = (page - 1) * limit

  const results = await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset)

  const totalRow = await db.select({ total: count() }).from(media).get()
  const total = totalRow?.total ?? 0

  return {
    media: results.map(row => ({
      id: row.id,
      url: mediaUrl(row.r2Key),
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      createdAt: row.createdAt,
    })),
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalCount: total,
    },
  }
})
