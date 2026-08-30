import { test, expect } from '@playwright/test'

// docs/specs/testing.md §5.2「いいね」シナリオ。
// いいねボタンでカウントが増加し、連打してもカウントが1回分しか増えないことを確認する。
// フィクスチャ: scripts/seed-test-data.ts の e2e-published-2
test('いいねボタンでカウントが増加し、再クリックしても増えない', async ({
  page,
}) => {
  await page.goto('/posts/e2e-published-2')

  const likeButton = page.getByRole('button', { name: /いいね/ })
  const initialText = (await likeButton.textContent()) ?? ''
  const initialCount = Number(initialText.match(/(\d+)/)?.[1] ?? '0')

  // 同一ロード内の連打防止（liked状態でボタンがdisabledになる）
  await likeButton.click()
  await expect(likeButton).toHaveText(
    new RegExp(`❤ いいね済み ${initialCount + 1}`)
  )
  await expect(likeButton).toBeDisabled()

  // client_idクッキーによるサーバー側の冪等性（別ロードでの再クリックでも増えない）
  await page.reload()
  const reloadedButton = page.getByRole('button', { name: /いいね/ })
  await expect(reloadedButton).toHaveText(
    new RegExp(`🤍 いいね ${initialCount + 1}`)
  )
  await reloadedButton.click()
  await expect(reloadedButton).toHaveText(
    new RegExp(`いいね済み ${initialCount + 1}`)
  )
})
