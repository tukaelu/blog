import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「記事の作成〜公開」シナリオ。
// 管理画面で記事を新規作成・公開すると、公開サイトの一覧・詳細に表示されることを確認する。
test('記事を作成して公開すると公開サイトの一覧・詳細に表示される', async ({
  page,
}) => {
  const unique = Date.now()
  const title = `E2E公開テスト${unique}`
  const slug = `e2e-publish-${unique}`
  const bodyText = `E2Eテストが作成した本文${unique}`
  const description = 'E2Eテストが作成した概要文'

  await page.goto('/admin/articles/new')

  await page.getByPlaceholder('タイトル').fill(title)
  await page.locator('.ProseMirror').click()
  await page.keyboard.type(bodyText)

  await page.getByTitle('記事の設定').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByPlaceholder('スラッグ（例: my-post）').fill(slug)
  await dialog.locator('textarea[data-slot="textarea"]').fill(description)
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '下書き' }).click()
  // ヘッダーの「保存済み」表示はidle初期状態でも同じ文言になるため保存完了の
  // 同期には使えない。PUTのレスポンス自体を待ってから次の操作へ進む
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

  await page.goto(`/posts/${slug}`)
  await expect(
    page.getByRole('heading', { level: 1, name: title })
  ).toBeVisible()
  await expect(page.getByText(bodyText)).toBeVisible()
})
