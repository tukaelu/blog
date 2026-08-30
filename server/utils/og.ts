import type { H3Event } from 'h3'
import { loadOgAssets, type AssetFetcher, type OgAssets } from './og-assets'
import { renderOgImage } from './og-renderer'

// pnpm devのcloudflareバインディングエミュレーションはASSETSからのフォント取得が
// 安定しないため、ローカルではファイルシステムから直接読む（本番はASSETSバインディング経由）。
const LOCAL_ASSET_DIRECTORIES = ['public', '.output/public']

let ogAssets: Promise<OgAssets> | undefined

function inputPathname(input: Request | URL | string): string {
  if (input instanceof Request) return new URL(input.url).pathname
  if (input instanceof URL) return input.pathname
  return new URL(input).pathname
}

const localAssetFetcher: AssetFetcher = {
  fetch: async input => {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const path = inputPathname(input).replace(/^\//, '')

    for (const directory of LOCAL_ASSET_DIRECTORIES) {
      const bytes = await readFile(join(process.cwd(), directory, path)).catch(
        () => undefined
      )
      if (bytes) return new Response(new Uint8Array(bytes))
    }
    return new Response(null, { status: 404 })
  },
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

function isAssetFetcher(value: unknown): value is AssetFetcher {
  return isObject(value) && typeof Reflect.get(value, 'fetch') === 'function'
}

function getAssetFetcher(event: H3Event): AssetFetcher {
  const cloudflare = Reflect.get(event.context, 'cloudflare')
  if (!isObject(cloudflare)) return localAssetFetcher

  const env = Reflect.get(cloudflare, 'env')
  if (!isObject(env)) return localAssetFetcher

  const assets = Reflect.get(env, 'ASSETS')
  return isAssetFetcher(assets) ? assets : localAssetFetcher
}

function getOgAssets(fetcher: AssetFetcher): Promise<OgAssets> {
  if (!ogAssets) {
    ogAssets = loadOgAssets(fetcher).catch((error: unknown) => {
      ogAssets = undefined
      throw error
    })
  }
  return ogAssets
}

export async function renderOgImageResponse(
  event: H3Event,
  title: string
): Promise<Response> {
  const assets = await getOgAssets(getAssetFetcher(event))
  return renderOgImage(title, assets)
}
