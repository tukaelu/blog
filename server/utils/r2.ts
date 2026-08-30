import type { H3Event } from 'h3'

export function useR2(event: H3Event): R2Bucket {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  const bucket = env?.IMAGES
  if (!bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding "IMAGES" is not available',
    })
  }
  return bucket
}
