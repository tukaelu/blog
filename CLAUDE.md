# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup

```bash
pnpm install    # Install dependencies
```

### Build / Test

```bash
pnpm dev          # Start Nuxt dev server (nuxi dev)
pnpm build        # Production build (nuxi build)
pnpm preview      # Preview production build via wrangler dev
pnpm deploy       # Build and deploy to Cloudflare Workers (nuxt build && wrangler deploy)
pnpm check        # Type check (nuxi typecheck)
pnpm test:unit    # Unit tests (Vitest)
pnpm test:e2e     # E2E tests: applies local D1 migrations, seeds fixtures, runs Playwright
pnpm fmt          # Format with Prettier
pnpm fmt:check    # Check formatting
pnpm db:generate  # Generate Drizzle migration from schema changes (drizzle-kit generate)
pnpm cf-typegen   # Regenerate worker-configuration.d.ts from wrangler bindings
```

## Architecture Overview

本プロジェクトは、旧Astro静的サイトを全面刷新した自作CMSである。
詳細な設計判断は `docs/architecture.md`、`docs/requirements.md`、`docs/specs/*.md` を参照。
運用系のセットアップ進捗は `docs/ops-setup-checklist.md` を参照。

### Tech Stack

- **Framework:** Nuxt 4（Vue 3）+ Nitro
- **Hosting:** Cloudflare Workers（Nitro `cloudflare` preset）
- **Editor:** Tiptap（ProseMirror）。記事本文はJSON文書モデルのままD1へ永続化する
- **Database:** Cloudflare D1（SQLite）+ Drizzle ORM。全文検索はFTS5仮想テーブル
- **Storage:** Cloudflare R2（画像等のメディア、OGP画像キャッシュ）
- **Auth:** Cloudflare Access（管理画面 `/admin/*` `/api/admin/*` 保護）
- **Styling:** Tailwind CSS v4 + shadcn-vue
- **OGP images:** takumi-rs（`@takumi-rs/wasm`、Rust製）
- **AI assist:** OpenAI + Cloudflare AI Gateway（校正・要約・タイトル/スラッグ提案）
- **Observability:** OpenTelemetry（`@microlabs/otel-cf-workers`）→ Mackerel（OTLP/HTTP）
- **Unit test:** Vitest / **E2E test:** Playwright

### Project Structure

```
├── app/                  # Nuxt本体（srcDir）
│   ├── components/
│   │   ├── editor/       # Tiptapエディタ本体、独自ノード
│   │   ├── admin/        # 管理画面用コンポーネント
│   │   ├── site/         # 公開ページ用コンポーネント
│   │   └── ui/           # shadcn-vueベースの汎用UI
│   ├── composables/
│   ├── layouts/
│   ├── pages/
│   │   ├── admin/        # 管理画面（記事編集、一覧、メディア等）
│   │   ├── posts/        # 記事詳細
│   │   ├── tags/
│   │   └── page/         # ページネーション
│   └── lib/
├── server/                # Nitro API Routes
│   ├── api/
│   │   ├── articles/、tags/、og/       # 公開API
│   │   └── admin/                     # 管理API（記事CRUD、リビジョン、メディア、AI支援）
│   ├── database/schema.ts # Drizzleスキーマ（D1）
│   ├── middleware/
│   └── utils/
├── shared/                # client/server共通の型（記事、Tiptapノード、AI）
│   ├── types/
│   └── utils/             # stable-stringify等
├── migrations/            # D1 SQLマイグレーション（Wrangler既定パス）
├── scripts/
│   └── seed-test-data.ts  # E2E用フィクスチャ投入
├── tests/e2e/              # Playwright E2Eテスト
├── docs/
│   ├── requirements.md / architecture.md
│   ├── ops-setup-checklist.md   # 運用セットアップの進捗トラッカー
│   └── specs/                   # 機能仕様書（article-editing / ai-assist / media / ops / testing 等）
├── wrangler.jsonc          # 本番バインディング定義
├── wrangler.preview.jsonc  # プレビュー環境バインディング（CIがビルド前にwrangler.jsoncへ差し替え）
└── nuxt.config.ts
```

### データの扱い

記事本文、タグ、いいね等のメタデータはすべてD1（`server/database/schema.ts`、Drizzle ORM）で管理する。
旧Astro時代のようなMarkdown/MDXファイルやfrontmatterスキーマは存在しない。
記事本文はTiptapが生成するJSON文書としてそのままDBに保存される（`docs/architecture.md` §3.3）。
画像等のメディアはR2に保存する。

## Guidelines

### Code Style

Prettier is used for formatting. Key settings: 2-space indent, no semicolons, single quotes.
