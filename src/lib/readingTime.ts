// 日本語の平均読書速度（約500文字/分）を基準とした推定値
const CHARS_PER_MINUTE = 500

export const calcReadingTime = (body: string): number => {
  const charCount = body.replace(/\s+/g, '').length
  return Math.max(1, Math.round(charCount / CHARS_PER_MINUTE))
}
