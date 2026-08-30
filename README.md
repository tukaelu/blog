# blog

個人ブログ

## Tech Stack

- **Framework:** Nuxt 4（Vue 3）+ Nitro
- **Hosting:** Cloudflare Workers（Nitro `cloudflare` preset）
- **Editor:** Tiptap（ProseMirror）
- **Database:** Cloudflare D1（SQLite）+ Drizzle ORM
- **Storage:** Cloudflare R2
- **Auth:** Cloudflare Access
- **Styling:** Tailwind CSS v4 + shadcn-vue

詳細は `CLAUDE.md` および `docs/architecture.md`、`docs/requirements.md`、`docs/specs/*.md` を参照。

## Commands

```bash
pnpm install      # 依存関係のインストール
pnpm dev          # 開発サーバー起動
pnpm build        # 本番ビルド
pnpm preview      # 本番ビルドのプレビュー（wrangler dev）
pnpm deploy       # ビルド＆Cloudflare Workersへデプロイ
pnpm check        # 型チェック
pnpm test:unit    # ユニットテスト（Vitest）
pnpm test:e2e     # E2Eテスト（Playwright）
pnpm fmt          # Prettierでフォーマット
pnpm db:generate  # Drizzleマイグレーション生成
pnpm cf-typegen   # wrangler bindingsから型定義を再生成
```
