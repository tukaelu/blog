import { container, image, text } from '@takumi-rs/helpers'
import initTakumi, { Renderer } from '@takumi-rs/wasm'
// Cloudflare Workersはランタイムでのwasmコンパイル（new WebAssembly.Module）を禁止するため、
// ?moduleでの静的importによりWranglerにビルド時プリコンパイルさせる（architecture.md §10）。
// バイナリはリポジトリへコピーせず、パッケージが公開しているサブパスから直接importする。
import wasmModule from '@takumi-rs/wasm/takumi_wasm_bg.wasm?module'
import { SITE_DOMAIN } from '#shared/constants'
import type { OgAssets } from './og-assets'

const IMAGE_WIDTH = 1200
const IMAGE_HEIGHT = 630
const AVATAR_SIZE = 72
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

let renderer: Promise<Renderer> | undefined

function getRenderer(): Promise<Renderer> {
  if (!renderer) {
    renderer = initTakumi({ module_or_path: wasmModule })
      .then(() => new Renderer())
      .catch((error: unknown) => {
        renderer = undefined
        throw error
      })
  }
  return renderer
}

// 旧Astroサイト（src/lib/ogp.ts）のデザインを踏襲：ミントグリーン背景に白い角丸カード、
// 中央にタイトル、右下にアバターとサイトドメインを配置する。
export async function renderOgImage(
  title: string,
  assets: OgAssets
): Promise<Response> {
  const node = container({
    style: {
      display: 'flex',
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      padding: 40,
      backgroundColor: '#99d8d7',
    },
    children: [
      container({
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 24,
          backgroundColor: '#fcfcfc',
        },
        children: [
          container({
            style: {
              display: 'flex',
              flex: 1,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 56px',
            },
            children: [
              text(title, {
                color: '#18181b',
                fontFamily: 'Noto Sans JP',
                fontSize: 54,
                fontWeight: 700,
                textAlign: 'center',
              }),
            ],
          }),
          container({
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              paddingRight: 56,
              paddingBottom: 40,
            },
            children: [
              image({
                src: 'avatar',
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                style: {
                  marginRight: 16,
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                },
              }),
              text(SITE_DOMAIN, {
                color: '#27272a',
                fontFamily: 'Noto Sans JP',
                fontSize: 24,
                fontWeight: 700,
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const activeRenderer = await getRenderer()
  const output = await activeRenderer.render(node, {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    format: 'png',
    fonts: [{ data: assets.font, name: 'Noto Sans JP', weight: 700 }],
    images: [{ data: assets.avatar, src: 'avatar' }],
  })

  return new Response(output, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': CACHE_CONTROL,
    },
  })
}
