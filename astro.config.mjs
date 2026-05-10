// @ts-check
import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import UnoCSS from '@unocss/astro'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'

import ogpImages from './src/integrations/ogp-images.ts'
import pagefind from './src/integrations/pagefind.ts'
import updateCsp from './src/integrations/update-csp.ts'

// https://astro.build/config
export default defineConfig({
  site: 'https://nsymtks.com',
  output: 'static',
  integrations: [
    UnoCSS({ injectReset: true }),
    mdx(),
    sitemap(),
    ogpImages(),
    pagefind(),
    updateCsp(),
  ],
  adapter: cloudflare(),
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
  },
  vite: {
    optimizeDeps: {
      include: ['date-fns', 'date-fns-tz', 'astro/zod'],
    },
  },
})
