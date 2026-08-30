import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「認証」シナリオ。
// 他の全シナリオはplaywright.config.tsのextraHTTPHeadersでダミーのCloudflare
// Accessヘッダーを常時付与しており、管理画面はこのヘッダーの有無だけで保護される
// （server/middleware/auth.ts）。このファイルだけヘッダーを外し、
// 本番でCloudflare Accessが機能しなかった場合の防御（多層防御）を検知できるようにする。
//
// nuxt build後にwrangler devで動かす今回のE2E方式では、import.meta.devによる
// ローカル開発バイパスは効かないため（実機確認済み）、ヘッダーなしアクセスは401になる。
test.use({ extraHTTPHeaders: {} })

test('Accessヘッダーなしで管理画面へアクセスすると401になる', async ({
  page,
}) => {
  const response = await page.goto('/admin/articles')
  expect(response?.status()).toBe(401)
})
