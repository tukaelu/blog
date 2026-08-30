import { and, eq } from 'drizzle-orm'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { articleRevisions, articles } from '../../../../../../database/schema'

// 復元元リビジョンのスナップショットを articles へコピーし、新しいリビジョンとして記録する
// （過去のリビジョンは変更・削除しない非破壊な復元、spec-article-editing.md §6.4）。
export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const revisionId = getRouterParam(event, 'revisionId') as string
  const db = useDrizzle(event)

  const source = await db
    .select()
    .from(articleRevisions)
    .where(
      and(
        eq(articleRevisions.id, revisionId),
        eq(articleRevisions.articleId, id)
      )
    )
    .get()
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  }

  const bodyJson: TiptapNode = JSON.parse(source.bodyJson)
  const bodyText = extractPlainText(bodyJson)
  const now = new Date().toISOString()

  await db
    .update(articles)
    .set({
      title: source.title,
      description: source.description,
      bodyJson: source.bodyJson,
      bodyText,
      status: source.status,
      publishedAt: source.publishedAt,
      updatedAt: now,
    })
    .where(eq(articles.id, id))

  await indexArticle(db, id, source.title, bodyText)

  const revision = await createRevision(
    db,
    {
      id,
      title: source.title,
      description: source.description,
      bodyJson: source.bodyJson,
      status: source.status,
      publishedAt: source.publishedAt,
    },
    revisionId
  )

  return { id, revisionId: revision.id }
})
