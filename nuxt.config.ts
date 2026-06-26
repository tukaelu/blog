import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-08-20',
  devtools: { enabled: true },
  modules: [
    'nitro-cloudflare-dev',
    '@nuxt/fonts',
    'nuxt-og-image',
    'shadcn-nuxt',
  ],
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
    // nuxt-og-imageのフォント読み込み（ASSETSバインディング）に必須（architecture.md §10）。
    // 生成される wrangler.json は env.* を含められないため、プレビュー環境は wrangler.preview.jsonc に分離した（§11.1）。
    cloudflare: { deployConfig: true },
  },
  fonts: {
    // OGP画像の日本語タイトル描画専用。サイト全体のCSSには適用しない（global: false）
    families: [{ name: 'Noto Sans JP', weights: [700], global: false }],
  },
})
