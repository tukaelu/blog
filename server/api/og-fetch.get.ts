import { parse } from 'node-html-parser'
import { z } from 'zod'

const querySchema = z.object({ url: z.string().url() })

export interface OgpResult {
  title: string
  description: string
  url: string
  image: string | null
  host: string
}

// linkCardノードのリッチカード表示用にOGP情報を取得する（既存Astro実装のEmbeddedLink.astroを踏襲）。
export default defineEventHandler(async (event): Promise<OgpResult | null> => {
  const { url } = await getValidatedQuery(event, querySchema.parse)

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    if (isBlockedHost(parsed.hostname)) {
      return null
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null

    const html = await res.text()
    const root = parse(html)
    const getMeta = (property: string) =>
      root
        .querySelector(`meta[property="${property}"]`)
        ?.getAttribute('content') ?? ''

    return {
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      url: getMeta('og:url') || url,
      image: getMeta('og:image') || null,
      host: parsed.host,
    }
  } catch {
    return null
  }
})
