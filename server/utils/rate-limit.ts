import type { H3Event } from 'h3'

// Cloudflare Workers Rate Limiting Binding（architecture.md §8.2）。
// ローカル開発等でbindingが未設定の場合は制限しない（wrangler.jsonc未反映環境向けのフォールバック）。
async function checkRateLimit(
  limiter: RateLimit | undefined,
  key: string
): Promise<boolean> {
  if (!limiter) return true
  const { success } = await limiter.limit({ key })
  return success
}

export async function checkLikeRateLimit(
  event: H3Event,
  key: string
): Promise<boolean> {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  return checkRateLimit(env?.LIKE_RATE_LIMITER, key)
}

// og-fetchは未認証で任意URLをfetchできるエンドポイントのため、オープンプロキシ的な
// 濫用・サーバー自体への負荷を防ぐために同一IPからの連打を制限する
export async function checkOgFetchRateLimit(
  event: H3Event,
  key: string
): Promise<boolean> {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  return checkRateLimit(env?.OG_FETCH_RATE_LIMITER, key)
}
