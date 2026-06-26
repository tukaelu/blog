// 既存記事（Astro + Markdown/MDX、contents/posts/ja配下）を新CMSのD1/R2へ移行する
// 一度きりのCLIスクリプト（docs/specs/migration.md）。
//
// 使い方:
//   pnpm migrate:posts                  # dry-run（DB/R2への書き込みなし。変換結果と要手動確認リストを出力）
//   pnpm migrate:posts -- --apply       # 本実行（D1へのINSERT・R2へのアップロードを行う）
//   pnpm migrate:posts -- --slug=foo,bar  # 対象記事をslugで絞り込む（デバッグ用）
//
// 対象はcontents/posts/ja配下のみ。en配下は移行しない
// （新CMSのarticlesテーブルにロケール列がなくslugがテーブル全体でUNIQUEのため、
// ja/enで同じslugを持つ記事が2件あると衝突する。ユーザー確認の上でenは対象外とした）。
import { randomUUID } from 'node:crypto'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { getPlatformProxy } from 'wrangler'
import { imageSize } from 'image-size'
import * as schema from '../server/database/schema'
import { articles, media } from '../server/database/schema'
import { resolveTagIds, replaceArticleTags } from '../server/utils/tags'
import { createRevision } from '../server/utils/revisions'
import { indexArticle } from '../server/utils/search-index'
import { extractPlainText } from '../server/utils/tiptap-text'
import { extensionForMime, mediaUrl } from '../server/utils/media'
import { articleInputSchema } from '../server/utils/article-input'
import type { TiptapNode } from '../shared/types/tiptap-nodes'
import { markdownToTiptap } from './migrate-posts.mdast-to-tiptap'

const ROOT_DIR = path.resolve(fileURLToPath(import.meta.url), '../..')
const POSTS_DIR = path.join(ROOT_DIR, 'contents/posts/ja')
const OUTPUT_DIR = path.join(ROOT_DIR, 'scripts/.migration-output')

const EXT_TO_MIME: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
}
const EXT_TO_MIME_VALUES = new Set(Object.values(EXT_TO_MIME))

interface CliOptions {
  apply: boolean
  slugs: string[] | null
}

function parseArgs(argv: string[]): CliOptions {
  const apply = argv.includes('--apply')
  const slugArg = argv.find(arg => arg.startsWith('--slug='))
  const slugs = slugArg
    ? slugArg.slice('--slug='.length).split(',').filter(Boolean)
    : null
  return { apply, slugs }
}

async function findPostFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findPostFiles(full)))
    } else if (entry.name === 'index.mdx') {
      files.push(full)
    }
  }
  return files
}

function toIsoDate(value: unknown, field: string): string {
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `フロントマターの${field}が日付として解釈できません: ${String(value)}`
    )
  }
  return date.toISOString()
}

interface ImageRef {
  node: TiptapNode
  isRemote: boolean
}

function collectImageNodes(node: TiptapNode, out: ImageRef[]): void {
  if (node.type === 'image') {
    const src = String(node.attrs?.src ?? '')
    out.push({ node, isRemote: /^https?:\/\//.test(src) })
  }
  for (const child of node.content ?? []) collectImageNodes(child, out)
}

interface UploadEnv {
  DB: D1Database
  IMAGES: R2Bucket
}

// server/api/admin/media/index.post.ts と同じ手順（id生成→R2アップロード→media行INSERT）で、
// 記事本文中の画像1件を移行する。失敗時は元の参照を残したまま manualReview に記録して継続する。
async function migrateImage(
  ref: ImageRef,
  postDir: string,
  env: UploadEnv | null,
  manualReview: string[]
): Promise<void> {
  const src = String(ref.node.attrs?.src ?? '')
  let bytes: Uint8Array
  let mimeType: string

  if (ref.isRemote) {
    if (!env) {
      manualReview.push(
        `[dry-run] 外部画像（本実行でR2へ取り込み予定）: ${src}`
      )
      return
    }
    const res = await fetch(src)
    if (!res.ok) {
      manualReview.push(
        `外部画像の取得に失敗しました（元URLのまま残します）: ${src} (HTTP ${res.status})`
      )
      return
    }
    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim()
    if (!contentType || !EXT_TO_MIME_VALUES.has(contentType)) {
      manualReview.push(
        `外部画像のMIMEタイプが未対応です（元URLのまま残します）: ${src} (${contentType})`
      )
      return
    }
    mimeType = contentType
    bytes = new Uint8Array(await res.arrayBuffer())
  } else {
    const resolved = path.resolve(postDir, src)
    const ext = path.extname(src).slice(1).toLowerCase()
    const mime = EXT_TO_MIME[ext]
    if (!mime) {
      manualReview.push(
        `未対応の画像拡張子です（元パスのまま残します）: ${src}`
      )
      return
    }
    try {
      bytes = await readFile(resolved)
    } catch {
      manualReview.push(
        `ローカル画像が見つかりません（元パスのまま残します）: ${src}`
      )
      return
    }
    mimeType = mime
    if (!env) {
      manualReview.push(
        `[dry-run] ローカル画像（本実行でR2へアップロード予定、${bytes.length}bytes）: ${src}`
      )
      return
    }
  }

  let width: number | null = null
  let height: number | null = null
  try {
    const size = imageSize(bytes)
    width = size.width
    height = size.height
  } catch {
    // ヘッダーからのサイズ抽出に失敗しても移行自体は継続する（既存エンドポイントと同じ方針）
  }

  const id = randomUUID()
  const r2Key = `media/${id}.${extensionForMime(mimeType)}`
  await env.IMAGES.put(r2Key, bytes, {
    httpMetadata: { contentType: mimeType },
  })
  const db = drizzle(env.DB, { schema })
  await db.insert(media).values({
    id,
    r2Key,
    mimeType,
    width,
    height,
    createdAt: new Date().toISOString(),
  })
  ref.node.attrs = { ...ref.node.attrs, src: mediaUrl(r2Key) }
}

interface MigrationOutcome {
  file: string
  slug: string
  status: 'migrated' | 'error'
  manualReview: string[]
  warnings: string[]
  reason?: string
}

async function migratePost(
  file: string,
  env: UploadEnv | null,
  seenSlugs: Set<string>
): Promise<MigrationOutcome> {
  const raw = await readFile(file, 'utf-8')
  const { data: fm, content: body } = matter(raw)
  const postDir = path.dirname(file)
  const dirSlug = path.basename(postDir)
  const slug = String(fm.slug ?? dirSlug)
  const warnings: string[] = []

  try {
    if (!fm.title) throw new Error('フロントマターにtitleがありません')
    if (!Array.isArray(fm.tags))
      throw new Error('フロントマターのtagsが配列ではありません')
    if (!fm.publishedAt)
      throw new Error('フロントマターにpublishedAtがありません')

    if (fm.unlisted === true) {
      warnings.push(
        '旧サイトの unlisted: true（一覧非表示・直リンク可能）は新CMSで未実装のため、通常の公開記事として一覧に表示されます'
      )
    }
    if (fm.icon) {
      warnings.push(
        'フロントマターのicon（絵文字アイコン）は新CMSのスキーマに存在しないため移行しません'
      )
    }

    const publishedAt = toIsoDate(fm.publishedAt, 'publishedAt')
    const createdAt = fm.createdAt
      ? toIsoDate(fm.createdAt, 'createdAt')
      : publishedAt
    const updatedAt = fm.updatedAt
      ? toIsoDate(fm.updatedAt, 'updatedAt')
      : publishedAt
    const status = fm.draft === true ? 'draft' : 'published'

    const { doc, manualReview } = markdownToTiptap(body)

    const imageRefs: ImageRef[] = []
    collectImageNodes(doc, imageRefs)
    for (const ref of imageRefs) {
      await migrateImage(ref, postDir, env, manualReview)
    }

    const input = articleInputSchema.parse({
      title: String(fm.title),
      slug,
      bodyJson: doc,
      description: fm.description ? String(fm.description) : null,
      tagNames: (fm.tags as unknown[]).map(String),
      status,
      publishedAt,
      coverImageId: null,
    })

    if (!env) {
      await mkdir(OUTPUT_DIR, { recursive: true })
      await writeFile(
        path.join(OUTPUT_DIR, `${slug}.json`),
        JSON.stringify({ input, manualReview, warnings }, null, 2)
      )
      return { file, slug, status: 'migrated', manualReview, warnings }
    }

    if (seenSlugs.has(slug)) {
      throw new Error(`slugが移行対象内で重複しています: ${slug}`)
    }
    const db = drizzle(env.DB, { schema })
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .get()
    if (existing) {
      throw new Error(`slugが既にDBへ登録済みです（処理を中断します）: ${slug}`)
    }

    const id = randomUUID()
    const bodyJsonStr = JSON.stringify(input.bodyJson)
    const bodyText = extractPlainText(input.bodyJson)
    const tagIds = await resolveTagIds(db, input.tagNames)

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
      createdAt,
      updatedAt,
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

    return { file, slug, status: 'migrated', manualReview, warnings }
  } catch (err) {
    return {
      file,
      slug,
      status: 'error',
      manualReview: [],
      warnings,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const allFiles = await findPostFiles(POSTS_DIR)
  const files = options.slugs
    ? allFiles.filter(file =>
        options.slugs!.includes(path.basename(path.dirname(file)))
      )
    : allFiles

  console.log(
    options.apply
      ? `本実行モード: ${files.length}件の記事をD1/R2へ移行します`
      : `dry-runモード: ${files.length}件の記事を変換します（DB/R2への書き込みは行いません）`
  )

  const proxy = options.apply ? await getPlatformProxy() : null
  const env = proxy ? (proxy.env as unknown as UploadEnv) : null

  const seenSlugs = new Set<string>()
  const outcomes: MigrationOutcome[] = []
  try {
    for (const file of files) {
      const outcome = await migratePost(file, env, seenSlugs)
      outcomes.push(outcome)
      if (
        outcome.status === 'error' &&
        options.apply &&
        outcome.reason?.includes('重複')
      ) {
        console.error(`\n中断: ${outcome.slug} — ${outcome.reason}`)
        break
      }
      if (outcome.status === 'migrated') seenSlugs.add(outcome.slug)
    }
  } finally {
    await proxy?.dispose()
  }

  const migrated = outcomes.filter(o => o.status === 'migrated')
  const errors = outcomes.filter(o => o.status === 'error')

  console.log(`\n=== 移行結果サマリ ===`)
  console.log(
    `成功: ${migrated.length}件 / エラー: ${errors.length}件 / 対象: ${files.length}件`
  )

  for (const outcome of outcomes) {
    if (outcome.status === 'error') {
      console.log(`\n[ERROR] ${outcome.slug} (${outcome.file})`)
      console.log(`  ${outcome.reason}`)
    } else if (outcome.manualReview.length || outcome.warnings.length) {
      console.log(`\n[OK] ${outcome.slug}`)
      for (const w of outcome.warnings) console.log(`  警告: ${w}`)
      for (const m of outcome.manualReview) console.log(`  要確認: ${m}`)
    }
  }

  if (!options.apply) {
    console.log(
      `\n変換結果のJSONを ${path.relative(ROOT_DIR, OUTPUT_DIR)}/ に出力しました`
    )
    console.log(
      '本実行する場合は `pnpm migrate:posts -- --apply` を実行してください'
    )
    console.log(
      '（.wrangler/state のD1/R2に直接書き込むため、実行後は `pnpm dev` の再起動が必要です）'
    )
  }

  if (errors.length > 0) process.exitCode = 1
}

await main()
