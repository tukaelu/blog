import { defineConfig, devices } from '@playwright/test'

// E2Eテストの実行環境・方針は docs/specs/testing.md §5 参照。
// D1はwrangler devプロセス間で共有されるローカルSQLiteのため、
// テスト間のデータ競合を避けるためCIは直列実行（workers: 1）に固定する。
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8787',
    trace: 'on-first-retry',
    // server/middleware/auth.ts は cf-access-jwt-assertion ヘッダーの有無のみを見る
    // （JWT検証自体はCloudflare Accessエッジ側の責務）。import.meta.devによる
    // ローカルバイパスはnuxt build後のwrangler devでは効かないため、
    // ダミー値のこのヘッダーを全テストへ常時付与して管理画面アクセスを確保する。
    extraHTTPHeaders: { 'cf-access-jwt-assertion': 'e2e-local-bypass' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
