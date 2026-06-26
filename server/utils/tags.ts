import { eq } from 'drizzle-orm'
import type { ArticleTag } from '#shared/types/article'
import { slugifyTagName } from '#shared/utils/slug'
import type { AppDatabase } from './db'
import { articleTags, tags } from '../database/schema'

// db.query.articles.findMany({ with: { articleTags: { with: { tag: true } } } }) の結果を
// ArticleTag[] へ整形する
export function toArticleTags(
  articleTags: { tag: { name: string; slug: string } }[]
): ArticleTag[] {
  return articleTags.map(at => ({ name: at.tag.name, slug: at.tag.slug }))
}

// 記事保存時にタグ名の配列からタグIDを解決する。既存タグは再利用し、なければ作成する
// （タグ専用の管理API/画面は要件上まだ未定義のため、記事編集画面からのフリーテキスト入力で完結させる設計とした）。
export async function resolveTagIds(
  db: AppDatabase,
  tagNames: string[]
): Promise<string[]> {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const raw of tagNames) {
    const name = raw.trim()
    // 同名タグが重複入力された場合、article_tagsへ同じ(articleId, tagId)を
    // 2回INSERTしようとして複合PRIMARY KEY違反になるため、ここで弾く
    if (!name || seen.has(name)) continue
    seen.add(name)
    // SELECTしてから未存在時のみINSERTする方式は、同名タグの同時作成で
    // UNIQUE制約違反による生エラーになるレースがあるため、
    // INSERT ... ON CONFLICT DO NOTHING（name一致時のみ）+ 再SELECTで冪等に解決する。
    await db
      .insert(tags)
      .values({ id: crypto.randomUUID(), name, slug: slugifyTagName(name) })
      .onConflictDoNothing({ target: tags.name })
    const row = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, name))
      .get()
    if (row) ids.push(row.id)
  }
  return ids
}

export async function replaceArticleTags(
  db: AppDatabase,
  articleId: string,
  tagIds: string[]
): Promise<void> {
  // DELETEとINSERTを別々のリクエストで発行すると、同一記事への同時PUTで
  // 互いのDELETE/INSERTが割り込み合い、UNIQUE制約違反になるレースがある。
  // 1回のdb.batch()にまとめてD1に原子的に実行させることで防ぐ。
  const statements = [
    db.delete(articleTags).where(eq(articleTags.articleId, articleId)),
    ...tagIds.map(tagId => db.insert(articleTags).values({ articleId, tagId })),
  ]
  await db.batch(
    statements as [(typeof statements)[number], ...typeof statements]
  )
}
