import { eq } from 'drizzle-orm'
import { articles } from '../../../../database/schema'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const input = await readValidatedBody(event, articleInputSchema.parse)
  const db = useDrizzle(event)

  const current = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .get()
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  const now = new Date().toISOString()
  const bodyJsonStr = JSON.stringify(input.bodyJson)
  const bodyText = extractPlainText(input.bodyJson)
  const tagIds = await resolveTagIds(db, input.tagNames)

  try {
    await db
      .update(articles)
      .set({
        slug: input.slug,
        title: input.title,
        description: input.description ?? null,
        bodyJson: bodyJsonStr,
        bodyText,
        coverImageId: input.coverImageId ?? null,
        status: input.status,
        publishedAt: input.publishedAt ?? null,
        updatedAt: now,
      })
      .where(eq(articles.id, id))
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'slug already exists',
      })
    }
    throw err
  }

  await replaceArticleTags(db, id, tagIds)
  await indexArticle(db, id, input.title, bodyText)

  const revision = await createRevision(db, {
    id,
    title: input.title,
    description: input.description ?? null,
    bodyJson: bodyJsonStr,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
  })

  return { id, revisionId: revision.id }
})
