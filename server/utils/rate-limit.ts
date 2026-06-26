import type { H3Event } from 'h3'

// Cloudflare Workers Rate Limiting Binding（architecture.md §8.2）。
// ローカル開発等でbindingが未設定の場合は制限しない（wrangler.jsonc未反映環境向けのフォールバック）。
export async function checkLikeRateLimit(
  event: H3Event,
  key: string
): Promise<boolean> {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  const limiter = env?.LIKE_RATE_LIMITER
  if (!limiter) return true
  const { success } = await limiter.limit({ key })
  return success
}
