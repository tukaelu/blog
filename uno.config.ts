import { defineConfig, presetWind3, type PresetMiniTheme } from 'unocss'
import presetTypography from '@unocss/preset-typography'

export default defineConfig<PresetMiniTheme>({
  presets: [
    presetWind3({
      dark: 'class',
    }),
    presetTypography(),
  ],
  theme: {
    colors: {
      odwr: {
        100: '#bce3e2',
        200: '#99d8d7',
        300: '#77cdcc',
      },
    },
    fontFamily: {
      sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
    },
  },
})
