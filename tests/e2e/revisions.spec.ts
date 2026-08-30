import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「リビジョン」シナリオ。
// 記事を複数回明示保存すると、リビジョン一覧・差分表示・復元が機能することを確認する。
//
// 自動保存はサーバーへid発行を要求しない（localStorageへの下書き保存のみ）ため、
// 新規記事はid未発行のまま初回の明示保存を迎える。初回はPOST /api/admin/articles、
// 2回目以降はPUT /api/admin/articles/:idが呼ばれ、いずれもリビジョンを1件作成するため
// （server/api/admin/articles/index.post.ts, [id]/index.put.ts）、2回の明示保存で
// 2件のリビジョンが生成される。
test('記事を複数回保存するとリビジョンの一覧・差分・復元が機能する', async ({
  page,
}) => {
  const unique = Date.now()
  const slug = `e2e-revisions-${unique}`
  const titleV1 = `E2Eリビジョンテスト${unique}v1`
  const titleV2 = `E2Eリビジョンテスト${unique}v2`

  await page.goto('/admin/articles/new')
  await page.getByPlaceholder('タイトル').fill(titleV1)
  await page.locator('.ProseMirror').click()
  await page.keyboard.type('リビジョンテスト本文')

  // スラッグを明示的に設定しておく（未設定のまま保存すると、記事作成時に
  // サーバーが払い出したスラッグがフォームのローカル状態へ反映されず、
  // PUTに空文字列のスラッグが送られてバリデーションエラーになるため）
  await page.getByTitle('記事の設定').click()
  await page
    .getByRole('dialog')
    .getByPlaceholder('スラッグ（例: my-post）')
    .fill(slug)
  await page.keyboard.press('Escape')

  // ヘッダーの「保存済み」表示はidle初期状態でも同じ文言になるため保存完了の
  // 同期には使えない。都度レスポンス自体を待ってから次の操作へ進む
  async function saveAsDraft(method: 'POST' | 'PUT') {
    const urlPattern =
      method === 'POST'
        ? /\/api\/admin\/articles$/
        : /\/api\/admin\/articles\/[^/]+$/
    const [res] = await Promise.all([
      page.waitForResponse(
        r => urlPattern.test(r.url()) && r.request().method() === method
      ),
      page.getByRole('menuitem', { name: '下書きにする' }).click(),
    ])
    expect(res.ok()).toBeTruthy()
  }

  await page.getByRole('button', { name: '下書き' }).click()
  await saveAsDraft('POST')
  // 初回保存で /admin/articles/new から /admin/articles/{id}（UUID）へ遷移し
  // ArticleFormが再マウントされる。遷移完了（"new"ではなくUUID形式のURLになること）を
  // 待ってから次の操作に進む
  await expect(page).toHaveURL(
    /\/admin\/articles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  )

  // fill()だと再マウント直後のタイトル欄で入力が反映されないことがあるため、
  // クリック+全選択+タイプで確実に入力する
  const titleField = page.getByPlaceholder('タイトル')
  await titleField.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(titleV2)
  await expect(titleField).toHaveValue(titleV2)

  await page.getByRole('button', { name: '下書き' }).click()
  await saveAsDraft('PUT')

  await page.getByTitle('リビジョン履歴').click()
  await expect(page).toHaveURL(/\/admin\/articles\/.+\/revisions$/)

  await expect(page.getByText(/^#\d+ /)).toHaveCount(2)
  await expect(page.getByText(titleV1, { exact: false }).first()).toBeVisible()
  await expect(page.getByText(titleV2, { exact: false }).first()).toBeVisible()

  // デフォルト（最新リビジョンv2と直前リビジョンv1の比較）で差分が表示される
  await expect(page.locator('ins, del').first()).toBeVisible()

  // 比較対象を「現在の内容」に切り替える。最新リビジョン=現在の内容のため差分は消える
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: '現在の内容' }).click()
  await expect(page.locator('ins, del')).toHaveCount(0)

  // v1のリビジョンへ復元する
  page.once('dialog', dialog => dialog.accept())
  await page
    .getByText(titleV1, { exact: false })
    .first()
    .locator('..')
    .getByRole('button', { name: 'このバージョンに戻す' })
    .click()

  await expect(page).toHaveURL(/\/admin\/articles\/[^/]+$/)
  await expect(page.getByPlaceholder('タイトル')).toHaveValue(titleV1)
})
