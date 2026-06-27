import { articles } from '../../../database/schema'

export default defineEventHandler(async event => {
  const input = await readValidatedBody(event, articleInputSchema.parse)
  const db = useDrizzle(event)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const bodyJsonStr = JSON.stringify(input.bodyJson)
  const bodyText = extractPlainText(input.bodyJson)
  const tagIds = await resolveTagIds(db, input.tagNames)

  try {
    await db.insert(articles).values({
      id,
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      bodyJson: bodyJsonStr,
      bodyText,
      coverImageId: input.coverImageId ?? null,
      status: input.status,
      publishedAt: input.publishedAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
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

  setResponseStatus(event, 201)
  return { id, revisionId: revision.id }
})
