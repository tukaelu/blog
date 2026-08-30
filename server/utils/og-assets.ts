export type AssetFetcher = {
  readonly fetch: (input: Request | URL | string) => Promise<Response>
}

export type OgAssets = {
  readonly font: Uint8Array
  readonly avatar: Uint8Array
}

const FONT_PATH = '/fonts/NotoSansJP-Bold.ttf'
const AVATAR_PATH = '/tuka-cre-124x124.png'

export class OgAssetLoadError extends Error {
  constructor(
    readonly path: string,
    readonly status?: number
  ) {
    super(
      status
        ? `OG asset request failed with ${status}: ${path}`
        : `OG asset is empty: ${path}`
    )
    this.name = 'OgAssetLoadError'
  }
}

async function loadAsset(
  fetcher: AssetFetcher,
  path: string
): Promise<Uint8Array> {
  const response = await fetcher.fetch(`https://assets.local${path}`)
  if (!response.ok) throw new OgAssetLoadError(path, response.status)

  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0) throw new OgAssetLoadError(path)
  return bytes
}

export async function loadOgAssets(fetcher: AssetFetcher): Promise<OgAssets> {
  const [font, avatar] = await Promise.all([
    loadAsset(fetcher, FONT_PATH),
    loadAsset(fetcher, AVATAR_PATH),
  ])
  return { font, avatar }
}
