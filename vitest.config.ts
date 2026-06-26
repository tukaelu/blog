import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'server/**/*.test.ts',
      'shared/**/*.test.ts',
      'app/**/*.test.ts',
      'scripts/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
})
