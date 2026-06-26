// SSRF対策：ループバック・リンクローカル（クラウドのメタデータエンドポイント含む）・
// プライベートIPレンジ宛のリクエストを拒否する。DNSリバインディングまでは防げないが、
// og-fetch.get.tsのような未認証で任意URLを叩けるエンドポイントで、
// 明白な内部アドレスへの直叩きは最低限防ぐ。
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])
    if (a === 127) return true // loopback
    if (a === 10) return true // private
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 169 && b === 254) return true // link-local（クラウドメタデータ含む）
    if (a === 0) return true
    return false
  }

  if (host === '::1' || host === '[::1]') return true // loopback
  if (host.startsWith('fe80:') || host.startsWith('[fe80:')) return true // link-local
  if (host.startsWith('fc') || host.startsWith('fd')) return true // unique local

  return false
}
