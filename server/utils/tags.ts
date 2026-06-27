import { eq, inArray } from 'drizzle-orm'
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
  // 同名タグが重複入力された場合、article_tagsへ同じ(articleId, tagId)を
  // 2回INSERTしようとして複合PRIMARY KEY違反になるため、ここで弾く
  const names = [...new Set(tagNames.map(raw => raw.trim()).filter(Boolean))]
  if (!names.length) return []

  // タグ数ぶんSELECT→INSERTを逐次実行すると記事保存のたびに最大2N回のD1
  // ラウンドトリップが発生するため、INSERTをbatch()でまとめて1回、
  // IDの解決も1回のSELECTにまとめる。
  // SELECTしてから未存在時のみINSERTする方式は、同名タグの同時作成で
  // UNIQUE制約違反による生エラーになるレースがあるため、
  // INSERT ... ON CONFLICT DO NOTHING（name一致時のみ）+ 再SELECTで冪等に解決する。
  const inserts = names.map(name =>
    db
      .insert(tags)
      .values({ id: crypto.randomUUID(), name, slug: slugifyTagName(name) })
      .onConflictDoNothing({ target: tags.name })
  )
  await db.batch(inserts as [(typeof inserts)[number], ...typeof inserts])

  const rows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, names))
  const idByName = new Map(rows.map(row => [row.name, row.id]))

  return names
    .map(name => idByName.get(name))
    .filter((id): id is string => !!id)
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
