import Typography from "typography"
import TypographyTheme from "typography-theme-github"

TypographyTheme.overrideThemeStyles = () => {
  return {
    a: {
      boxShadow: `none`,
    },
    'a.anchor': {
      borderBottom: 'none',
    },
    'a.social': {
      borderBottom: 'none',
    },
    'a.tag': {
      backgroundColor: TypographyTheme.bodyColor,
      borderBottom: 'none',
      borderRadius: '100px',
      color: 'white',
      display: 'inline-block',
      fontSize: typography.rhythm(0.4),
      marginLeft: '5px',
      padding: '4px 8px',
    },
    small: {
      color: 'rgba(0, 0, 0, .54)',
      fontSize: '16px',
    },
    blockquote: {
      fontSize: TypographyTheme.baseFontSize,
    },
    ':not(pre)>code': {
      background: 'rgba(0, 0, 0, .05)',
      fontFamily: codeFontFamily.join(','),
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.58,
      letterSpacing: '-.003em',
      margin: '0 2px',
      textRendering: 'optimizeLegibility',
      padding: '3px 4px',
      wordBreak: 'break-word',
    },
  }
}

const textFontFamily = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Helvetica Neue",
  "游ゴシック体",
  "Yugothic",
  "游ゴシック",
  "Yu Gothic",
  "Verdana",
  "メイリオ",
  "sans-serif",
]
const codeFontFamily = [
  'Menlo',
  'Monaco',
  '"Courier New"',
  'Courier',
  'monospace',
]
TypographyTheme.headerFontFamily = textFontFamily
TypographyTheme.bodyFontFamily = textFontFamily
TypographyTheme.baseFontSize = '16px'
TypographyTheme.bodyColor = 'rgba(0, 0, 0, .84)'
TypographyTheme.headerWeight = 700

delete TypographyTheme.googleFonts

const typography = new Typography(TypographyTheme)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
