import { describe, expect, it } from 'vitest'
import { isBlockedHost } from './ssrf-guard'

describe('isBlockedHost', () => {
  it('外部ホストは許可する', () => {
    expect(isBlockedHost('example.com')).toBe(false)
    expect(isBlockedHost('1.1.1.1')).toBe(false)
  })

  it('ループバック・localhostを拒否する', () => {
    expect(isBlockedHost('localhost')).toBe(true)
    expect(isBlockedHost('127.0.0.1')).toBe(true)
    expect(isBlockedHost('::1')).toBe(true)
  })

  it('プライベートIPレンジを拒否する', () => {
    expect(isBlockedHost('10.0.0.1')).toBe(true)
    expect(isBlockedHost('172.16.0.1')).toBe(true)
    expect(isBlockedHost('172.31.255.255')).toBe(true)
    expect(isBlockedHost('172.32.0.1')).toBe(false)
    expect(isBlockedHost('192.168.1.1')).toBe(true)
  })

  it('リンクローカル（クラウドメタデータエンドポイント含む）を拒否する', () => {
    expect(isBlockedHost('169.254.169.254')).toBe(true)
    expect(isBlockedHost('fe80::1')).toBe(true)
  })
})
