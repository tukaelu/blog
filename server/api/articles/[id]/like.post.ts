import { count, eq } from 'drizzle-orm'
import { articles, likes } from '../../../database/schema'

// spec-public-site.md §4.5, §6.3: client_id はCookieで管理し、同一クライアントからの
// 2回目以降の呼び出しは冪等（onConflictDoNothingで重複INSERTを無視）に処理する。
// Cookieはクリアすれば再発行されるため、濫用対策の主眼はIPベースのレート制限に置く（architecture.md §8.2）。
export default defineEventHandler(async event => {
  const articleId = getRouterParam(event, 'id') as string
  const db = useDrizzle(event)

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const allowed = await checkLikeRateLimit(event, ip)
  if (!allowed) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get()
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  let clientId = getCookie(event, 'client_id')
  if (!clientId) {
    clientId = crypto.randomUUID()
    setCookie(event, 'client_id', clientId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }

  await db
    .insert(likes)
    .values({ articleId, clientId, createdAt: new Date().toISOString() })
    .onConflictDoNothing()

  const countRow = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, articleId))
    .get()

  return { likeCount: countRow?.count ?? 0, liked: true }
})
