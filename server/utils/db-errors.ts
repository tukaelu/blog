// D1（drizzle-orm経由）のUNIQUE制約違反は、DrizzleQueryError → D1_ERROR → SQLITE_CONSTRAINTと
// 何重かにラップされたcauseチェーンの奥にメッセージが入っている。事前チェック（SELECTしてから
// INSERT/UPDATE）は同時リクエスト間でレースするため、実際の書き込みを試みてこのエラーを
// 検知する方が確実（server/utils/tags.tsのON CONFLICT DO NOTHINGと同じ「DBに委ねる」方針）。
export function isUniqueConstraintError(err: unknown): boolean {
  let current: unknown = err
  while (current && typeof current === 'object') {
    const message = (current as { message?: unknown }).message
    if (
      typeof message === 'string' &&
      message.includes('UNIQUE constraint failed')
    ) {
      return true
    }
    current = (current as { cause?: unknown }).cause
  }
  return false
}
