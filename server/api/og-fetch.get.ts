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

const MAX_REDIRECTS = 5

// fetch()のデフォルト自動リダイレクト追従は、初回URLのホスト名だけをisBlockedHostで
// 検証しても、許可ホストからの302で内部アドレスへ容易に迂回されてしまう
// （リダイレクト先は再検証されないため）。redirect: 'manual'で追従を止め、
// 各ホップごとにホスト名を再検証しながら手動で辿る。
async function fetchWithGuard(initialUrl: string): Promise<Response | null> {
  let currentUrl = initialUrl
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    if (isBlockedHost(parsed.hostname)) return null

    const res = await fetch(currentUrl, {
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
    })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) return null
      currentUrl = new URL(location, currentUrl).toString()
      continue
    }
    return res
  }
  return null
}

// linkCardノードのリッチカード表示用にOGP情報を取得する（既存Astro実装のEmbeddedLink.astroを踏襲）。
export default defineEventHandler(async (event): Promise<OgpResult | null> => {
  const { url } = await getValidatedQuery(event, querySchema.parse)

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const allowed = await checkOgFetchRateLimit(event, ip)
  if (!allowed) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  try {
    const res = await fetchWithGuard(url)
    if (!res || !res.ok) return null

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
      host: new URL(res.url).host,
    }
  } catch {
    return null
  }
})
