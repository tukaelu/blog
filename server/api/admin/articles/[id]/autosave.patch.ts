import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { tiptapDocSchema } from '#shared/types/tiptap-nodes'
import { articles } from '../../../../database/schema'

// 部分更新のみ。リビジョンは作成しない（spec-article-editing.md §4.4, §6.2）。
const autosaveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(200).nullable().optional(),
  bodyJson: tiptapDocSchema.optional(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const input = await readValidatedBody(event, autosaveSchema.parse)
  const db = useDrizzle(event)

  const now = new Date().toISOString()
  const updates: Partial<typeof articles.$inferInsert> = { updatedAt: now }
  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.bodyJson !== undefined) {
    updates.bodyJson = JSON.stringify(input.bodyJson)
    updates.bodyText = extractPlainText(input.bodyJson)
  }

  const result = await db
    .update(articles)
    .set(updates)
    .where(eq(articles.id, id))

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  // title/body_textのいずれかが変わった場合、検索インデックスも追随させる
  // （部分更新のため、更新後の行を読み直して常に完全な内容で再同期する）。
  if (input.title !== undefined || input.bodyJson !== undefined) {
    const current = await db
      .select({ title: articles.title, bodyText: articles.bodyText })
      .from(articles)
      .where(eq(articles.id, id))
      .get()
    if (current) {
      await indexArticle(db, id, current.title, current.bodyText)
    }
  }

  return { savedAt: now }
})
