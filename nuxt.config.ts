import tailwindcss from '@tailwindcss/vite'
import { unwasm } from 'unwasm/plugin'

const isProductionBuild = process.env.NODE_ENV === 'production'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-08-20',
  devtools: { enabled: true },
  modules: ['nitro-cloudflare-dev', 'shadcn-nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  app: {
    head: {
      script: [
        {
          // ダークモード切り替え(class戦略)のFOUC防止。旧サイト(BaseLayout.astro)を踏襲
          innerHTML: `
            if (
              localStorage.getItem('theme') === 'dark' ||
              (!('theme' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
            ) {
              document.documentElement.classList.add('dark')
            }
          `,
        },
      ],
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: { deployConfig: true },
    // takumi-rsのwasmバイナリをWranglerにプリコンパイルさせるための静的import（*.wasm?module）を
    // 有効化する。esmImportはproductionビルドでのみ有効化（architecture.md §10参照）。
    rollupConfig: {
      plugins: [unwasm({ esmImport: isProductionBuild, silent: true })],
    },
  },
})
