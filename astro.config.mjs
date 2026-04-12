// @ts-check
import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import UnoCSS from '@unocss/astro'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'

// https://astro.build/config
export default defineConfig({
  site: 'https://nsymtks.com',
  output: 'static',
  integrations: [UnoCSS({ injectReset: true }), mdx(), sitemap()],
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
