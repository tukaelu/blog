import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { tiptapDocSchema } from '#shared/types/tiptap-nodes'
import { slugSchema } from '#shared/utils/slug'
import { articles } from '../../../../database/schema'

// 部分更新のみ。リビジョンは作成しない（spec-article-editing.md §4.4, §6.2）。
// 記事設定ダイアログ（slug/タグ/アイキャッチ/公開日時）もこのエンドポイントで
// カバーする。タイトル・本文と挙動を揃え、明示保存前の離脱で無警告に
// 消えるフィールドをなくすため。
const autosaveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(200).nullable().optional(),
  bodyJson: tiptapDocSchema.optional(),
  slug: slugSchema.optional(),
  tagNames: z.array(z.string()).optional(),
  coverImageId: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
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
  if (input.slug !== undefined) updates.slug = input.slug
  if (input.coverImageId !== undefined)
    updates.coverImageId = input.coverImageId
  if (input.publishedAt !== undefined) updates.publishedAt = input.publishedAt

  let result: { meta: { changes: number } }
  try {
    result = await db.update(articles).set(updates).where(eq(articles.id, id))
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'slug already exists',
      })
    }
    if (isForeignKeyConstraintError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'coverImageId does not reference an existing media',
      })
    }
    throw err
  }

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  if (input.tagNames !== undefined) {
    const tagIds = await resolveTagIds(db, input.tagNames)
    await replaceArticleTags(db, id, tagIds)
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
