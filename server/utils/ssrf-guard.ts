// SSRF対策：ループバック・リンクローカル（クラウドのメタデータエンドポイント含む）・
// プライベートIPレンジ宛のリクエストを拒否する。DNSリバインディングまでは防げないが、
// og-fetch.get.tsのような未認証で任意URLを叩けるエンドポイントで、
// 明白な内部アドレスへの直叩きは最低限防ぐ。
function isBlockedIpv4(
  aStr: string | undefined,
  bStr: string | undefined
): boolean {
  const a = Number(aStr)
  const b = Number(bStr)
  if (a === 127) return true // loopback
  if (a === 10) return true // private
  if (a === 172 && b >= 16 && b <= 31) return true // private
  if (a === 192 && b === 168) return true // private
  if (a === 169 && b === 254) return true // link-local（クラウドメタデータ含む）
  if (a === 0) return true
  return false
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) return isBlockedIpv4(ipv4[1], ipv4[2])

  // ブラケット付き（[::1]等）・なし双方に対応するため、判定前にブラケットを取り除く。
  // hostname自体にコロンが含まれるのはIPv6リテラルの場合のみのため、これでドメイン名
  // （例: fc2.com）との誤判定も防げる。
  const unbracketed = host.replace(/^\[/, '').replace(/\]$/, '')
  if (!unbracketed.includes(':')) return false

  if (unbracketed === '::1') return true // loopback
  if (unbracketed.startsWith('fe80:')) return true // link-local
  if (unbracketed.startsWith('fc') || unbracketed.startsWith('fd')) return true // unique local

  // IPv4射影IPv6アドレス（例: ::ffff:127.0.0.1, [::ffff:169.254.169.254]）
  const mapped = unbracketed.match(
    /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  )
  if (mapped) return isBlockedIpv4(mapped[1], mapped[2])

  return false
}
