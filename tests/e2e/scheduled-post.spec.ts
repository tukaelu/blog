import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「予約投稿」シナリオ。
// publishedAtが未来の記事はシード済み（scripts/seed-test-data.ts の e2e-scheduled）。
// 一覧に表示されないこと、過去日時に更新すると表示されるようになることを確認する。
test('未来日時の記事は公開一覧に表示されず、過去日時に更新すると表示される', async ({
  page,
}) => {
  const title = 'E2E予約投稿用フィクスチャ記事'

  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 2, name: title })
  ).not.toBeVisible()

  await page.goto('/admin/articles')
  await page.getByPlaceholder('タイトル・IDで検索').fill(title)
  await page.getByRole('link', { name: title }).click()

  await page.getByTitle('記事の設定').click()
  const dialog = page.getByRole('dialog')
  // 公開一覧は最新10件のみ表示するため、確実にページ1へ入るよう「直近の過去」を指定する
  // （2020年のような大昔の日付だと既存の実記事より古くなりページ1から外れてしまう）
  const past = new Date(Date.now() - 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const pastLocal = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}T${pad(past.getHours())}:${pad(past.getMinutes())}`
  await dialog.locator('input[type="datetime-local"]').fill(pastLocal)
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '公開済み' }).click()
  const [saveResponse] = await Promise.all([
    page.waitForResponse(
      res =>
        /\/api\/admin\/articles\/[^/]+$/.test(res.url()) &&
        res.request().method() === 'PUT'
    ),
    page.getByRole('menuitem', { name: '公開する' }).click(),
  ])
  expect(saveResponse.ok()).toBeTruthy()

  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 2, name: title })
  ).toBeVisible()
})
