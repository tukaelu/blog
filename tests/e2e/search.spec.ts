import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「検索」シナリオ。
// フィクスチャ: scripts/seed-test-data.ts の e2e-search-target（本文に一意なキーワードを含む）
test('キーワード検索でヒットする記事が表示される', async ({ page }) => {
  await page.goto('/search')
  await page.getByPlaceholder('検索語を入力').fill('ニンジャキーワード')
  await page.getByRole('button', { name: '検索' }).click()

  await expect(
    page.getByRole('link', { name: 'E2E検索用フィクスチャ記事' })
  ).toBeVisible()
})

test('一致しないキーワードでは0件になる', async ({ page }) => {
  await page.goto('/search')
  await page
    .getByPlaceholder('検索語を入力')
    .fill('絶対に一致しないはずのキーワードXYZ123')
  await page.getByRole('button', { name: '検索' }).click()

  await expect(
    page.getByText('一致する記事が見つかりませんでした')
  ).toBeVisible()
})
