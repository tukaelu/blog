// E2Eテスト用の最小限フィクスチャをローカルD1へ投入するスクリプト（docs/specs/testing.md §5.4）。
// scripts/migrate-posts.ts と同じくgetPlatformProxyでローカルD1バインディングに接続する。
//
// 使い方:
//   pnpm seed:e2e
//
// 投入前に e2e- 接頭辞の記事を一括削除してから挿入するため冪等（ローカルで
// .wrangler/state を消さずに繰り返し実行しても、slugのUNIQUE制約違反にならず、
// 過去の実行で作られた記事の残骸も蓄積しない）。
import { randomUUID } from 'node:crypto'
import { eq, like } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { getPlatformProxy } from 'wrangler'
import * as schema from '../server/database/schema'
import { articles } from '../server/database/schema'
import { resolveTagIds, replaceArticleTags } from '../server/utils/tags'
import { createRevision } from '../server/utils/revisions'
import {
  indexArticle,
  removeArticleFromIndex,
} from '../server/utils/search-index'
import { extractPlainText } from '../server/utils/tiptap-text'
import { articleInputSchema } from '../server/utils/article-input'
import type { TiptapNode } from '../shared/types/tiptap-nodes'

interface SeedEnv {
  DB: D1Database
}

function paragraphDoc(text: string): TiptapNode {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }
}

interface Fixture {
  slug: string
  title: string
  description: string
  bodyText: string
  tagNames: string[]
  status: 'draft' | 'published'
  publishedAt: string | null
}

const now = Date.now()
const DAY_MS = 24 * 60 * 60 * 1000

// テストコード側はIDをハードコードせず、公開ページはslugでURL遷移、
// 管理画面はタイトル文字列で要素を特定する（再実行でUUIDが変わっても安定させるため）。
const fixtures: Fixture[] = [
  {
    slug: 'e2e-search-target',
    title: 'E2E検索用フィクスチャ記事',
    description: 'E2Eの検索シナリオでヒットさせるための記事',
    bodyText:
      'このE2Eテストフィクスチャ記事にはニンジャキーワードという一意な単語を含みます',
    tagNames: ['e2e-fixture'],
    status: 'published',
    publishedAt: new Date(now - DAY_MS).toISOString(),
  },
  {
    slug: 'e2e-published-2',
    title: 'E2Eいいね用フィクスチャ記事',
    description: 'E2Eのいいねシナリオで使う記事',
    bodyText: 'このE2Eテストフィクスチャ記事はいいねシナリオの検証に使います',
    tagNames: ['e2e-fixture'],
    status: 'published',
    publishedAt: new Date(now - 2 * DAY_MS).toISOString(),
  },
  {
    slug: 'e2e-scheduled',
    title: 'E2E予約投稿用フィクスチャ記事',
    description: 'E2Eの予約投稿シナリオで使う未来日時の記事',
    bodyText: 'このE2Eテストフィクスチャ記事は予約投稿シナリオの検証に使います',
    tagNames: ['e2e-fixture'],
    status: 'published',
    publishedAt: new Date(now + 365 * DAY_MS).toISOString(),
  },
]

// ローカルでE2Eを繰り返し実行すると、article-publish/revisions specが
// 実行の都度ユニークなslug（e2e-publish-*, e2e-revisions-*）で記事を作り捨てるため、
// 古い残骸が蓄積して公開一覧の最新10件から固定フィクスチャが押し出されることがある。
// 毎回の投入前に e2e- 接頭辞の記事を一括削除し、常にクリーンな状態から始める
async function purgeStaleFixtures(
  db: ReturnType<typeof drizzle<typeof schema>>
): Promise<void> {
  const stale = await db
    .select({ id: articles.id })
    .from(articles)
    .where(like(articles.slug, 'e2e-%'))
  for (const row of stale) {
    await removeArticleFromIndex(db, row.id)
    await db.delete(articles).where(eq(articles.id, row.id))
  }
  if (stale.length) console.log(`  既存のe2e-*記事を${stale.length}件削除`)
}

async function seedFixture(
  db: ReturnType<typeof drizzle<typeof schema>>,
  fixture: Fixture
): Promise<void> {
  const bodyJson = paragraphDoc(fixture.bodyText)
  const input = articleInputSchema.parse({
    title: fixture.title,
    slug: fixture.slug,
    bodyJson,
    description: fixture.description,
    tagNames: fixture.tagNames,
    status: fixture.status,
    publishedAt: fixture.publishedAt,
    coverImageId: null,
  })

  const id = randomUUID()
  const bodyJsonStr = JSON.stringify(input.bodyJson)
  const bodyText = extractPlainText(input.bodyJson)
  const tagIds = await resolveTagIds(db, input.tagNames)
  const isoNow = new Date().toISOString()

  await db.insert(articles).values({
    id,
    slug: input.slug,
    title: input.title,
    description: input.description ?? null,
    bodyJson: bodyJsonStr,
    bodyText,
    coverImageId: null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    createdAt: isoNow,
    updatedAt: isoNow,
  })
  await replaceArticleTags(db, id, tagIds)
  await indexArticle(db, id, input.title, bodyText)
  await createRevision(db, {
    id,
    title: input.title,
    description: input.description ?? null,
    bodyJson: bodyJsonStr,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
  })

  console.log(`  投入: ${fixture.slug}`)
}

async function main(): Promise<void> {
  const proxy = await getPlatformProxy()
  const env = proxy.env as unknown as SeedEnv
  const db = drizzle(env.DB, { schema })

  console.log(`E2Eフィクスチャを投入します（${fixtures.length}件）`)
  try {
    await purgeStaleFixtures(db)
    for (const fixture of fixtures) {
      await seedFixture(db, fixture)
    }
  } finally {
    await proxy.dispose()
  }
  console.log('完了')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
