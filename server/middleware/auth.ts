// 管理画面（/admin/*, /api/admin/*）の保護は本来Cloudflare Accessがエッジで完結させる
// （docs/architecture.md §7: アプリケーション側に認証ロジックは実装しない、という決定は
// 「自前でログイン/セッション/JWT検証を実装しない」という意味で維持する）。
// このミドルウェアはAccessの設定漏れ・バイパスに対する多層防御として、
// Accessを通過したリクエストにのみ付与される `Cf-Access-Jwt-Assertion` ヘッダーの
// 有無だけを見る（JWTの検証自体はAccess/Cloudflareエッジ側の責務のまま）。
// ローカル開発（nuxi dev）はAccessが介在しないため無条件でバイパスする
// （docs/specs/ops.md §3.4, §5.3）。
export default defineEventHandler(event => {
  if (import.meta.dev) return

  const path = getRequestURL(event).pathname
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) return

  if (!getRequestHeader(event, 'cf-access-jwt-assertion')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
