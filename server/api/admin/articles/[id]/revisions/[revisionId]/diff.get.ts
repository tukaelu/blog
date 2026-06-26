import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { articleRevisions, articles } from '../../../../../../database/schema'

const querySchema = z.object({
  against: z.string().default('previous'),
})

// diffは常に「比較対象(before) -> URLで指定したリビジョン(after)」の向きで返す
// （spec-article-editing.md §3.4: デフォルトは直前リビジョンとの差分。against=current/他リビジョンでも同じ向きに揃える）。
export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') as string
  const revisionId = getRouterParam(event, 'revisionId') as string
  const { against } = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle(event)

  const target = await db
    .select()
    .from(articleRevisions)
    .where(
      and(
        eq(articleRevisions.id, revisionId),
        eq(articleRevisions.articleId, id)
      )
    )
    .get()
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  }

  let compareTitle = ''
  let compareDescription: string | null = null
  let compareBodyJson: TiptapNode = { type: 'doc', content: [] }

  if (against === 'current') {
    const article = await db
      .select({
        title: articles.title,
        description: articles.description,
        bodyJson: articles.bodyJson,
      })
      .from(articles)
      .where(eq(articles.id, id))
      .get()
    if (!article) {
      throw createError({ statusCode: 404, statusMessage: 'Article not found' })
    }
    compareTitle = article.title
    compareDescription = article.description
    compareBodyJson = JSON.parse(article.bodyJson)
  } else if (against === 'previous') {
    const prev = await db
      .select()
      .from(articleRevisions)
      .where(
        and(
          eq(articleRevisions.articleId, id),
          eq(articleRevisions.revisionNo, target.revisionNo - 1)
        )
      )
      .get()
    if (prev) {
      compareTitle = prev.title
      compareDescription = prev.description
      compareBodyJson = JSON.parse(prev.bodyJson)
    }
  } else {
    const other = await db
      .select()
      .from(articleRevisions)
      .where(
        and(
          eq(articleRevisions.id, against),
          eq(articleRevisions.articleId, id)
        )
      )
      .get()
    if (!other) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comparison revision not found',
      })
    }
    compareTitle = other.title
    compareDescription = other.description
    compareBodyJson = JSON.parse(other.bodyJson)
  }

  const targetBodyJson: TiptapNode = JSON.parse(target.bodyJson)

  return {
    titleDiff: diffPlainText(compareTitle, target.title),
    descriptionDiff: diffPlainText(
      compareDescription ?? '',
      target.description ?? ''
    ),
    bodyDiff: diffBodyText(
      extractRevisionText(compareBodyJson),
      extractRevisionText(targetBodyJson)
    ),
  }
})
