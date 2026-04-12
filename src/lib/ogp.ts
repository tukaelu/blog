import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'

import { SITE_DOMAIN } from './constants'

let parser: { parse: (text: string) => string[] } | null = null
const fontCache = new Map<string, ArrayBuffer>()

const getParser = async () => {
  if (parser) return parser
  const budoux = await import('budoux')
  parser = budoux.loadDefaultJapaneseParser()
  return parser
}

const fetchFontData = async (): Promise<void> => {
  const [fontRegular, fontBold] = await Promise.all([
    fetch(
      'https://raw.githubusercontent.com/googlefonts/zen-kakugothic/main/fonts/ttf/ZenKakuGothicAntique-Regular.ttf'
    ).then(res => {
      if (!res.ok)
        throw new Error(`Failed to fetch regular font: ${res.status}`)
      return res.arrayBuffer()
    }),
    fetch(
      'https://raw.githubusercontent.com/googlefonts/zen-kakugothic/main/fonts/ttf/ZenKakuGothicAntique-Bold.ttf'
    ).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch bold font: ${res.status}`)
      return res.arrayBuffer()
    }),
  ])
  fontCache.set('regular', fontRegular)
  fontCache.set('bold', fontBold)
}

const getAvatarDataUrl = (): string => {
  const avatarPath = path.resolve(
    process.cwd(),
    'public',
    'tuka-cre-124x124.png'
  )
  const avatarBuffer = fs.readFileSync(avatarPath)
  return `data:image/png;base64,${avatarBuffer.toString('base64')}`
}

export const generateOgpImage = async (title: string): Promise<Buffer> => {
  if (fontCache.size === 0) {
    await fetchFontData()
  }

  const regular = fontCache.get('regular')
  const bold = fontCache.get('bold')
  if (!regular || !bold) {
    throw new Error('Font data not loaded')
  }

  const p = await getParser()
  const lineBreakedTitle = p.parse(title)
  const avatarDataUrl = getAvatarDataUrl()

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '40px',
          backgroundColor: '#99d8d7',
        },
        children: {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              borderRadius: '24px',
              backgroundColor: '#fcfcfc',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flex: 1,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  children: {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        fontSize: '3.4rem',
                        fontWeight: 800,
                      },
                      children: lineBreakedTitle.map(lbt => ({
                        type: 'span',
                        props: { children: lbt },
                      })),
                    },
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    width: '100%',
                    paddingRight: '56px',
                    paddingBottom: '40px',
                    color: '#27272a',
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: avatarDataUrl,
                        width: 72,
                        height: 72,
                        style: {
                          marginRight: '16px',
                          width: '72px',
                          height: '72px',
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontWeight: 600,
                          fontFamily: 'Zen Kaku Gothic',
                          fontSize: '1.5rem',
                        },
                        children: SITE_DOMAIN,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [
        {
          name: 'Zen Kaku Gothic',
          data: regular,
          weight: 400,
          style: 'normal' as const,
        },
        {
          name: 'Zen Kaku Gothic',
          data: bold,
          weight: 600,
          style: 'normal' as const,
        },
      ],
    }
  )

  const ogpImage = new Resvg(svg).render().asPng()
  return Buffer.from(ogpImage)
}
