// 日本語の平均読書速度（400字/分、既存サイトの表示値から逆算した概算値）で読了時間を算出する（architecture.md §4.3）。
const CHARS_PER_MINUTE = 400

export function calcReadingTimeMinutes(bodyText: string): number {
  return Math.max(1, Math.ceil(bodyText.length / CHARS_PER_MINUTE))
}
