export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB（spec-media.md §4.1）

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function extensionForMime(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? 'bin'
}

export function mediaUrl(r2Key: string): string {
  // r2_key は "media/{id}.{ext}" 形式（spec-media.md §5）。配信パスの /media/:key と r2_key の "media/" が一致する。
  return `/${r2Key}`
}

// Cloudflare Image Transformationsでのオンザフライ変換配信URL（spec-media.md §6.2）。
export function transformedMediaUrl(r2Key: string, options: string): string {
  return `/cdn-cgi/image/${options}/${r2Key}`
}
