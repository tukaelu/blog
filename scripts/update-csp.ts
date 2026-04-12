/**
 * Post-build script to update CSP inline script hashes in _headers.
 *
 * Scans all HTML files in dist/client/, extracts inline <script> content,
 * computes SHA-256 hashes, and replaces the __CSP_SCRIPT_HASHES__ placeholder
 * in dist/client/_headers with the actual hashes.
 *
 * Usage: npx tsx scripts/update-csp.ts
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { glob } from 'glob'
import { parse } from 'node-html-parser'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const HEADERS_PATH = path.join(DIST_DIR, '_headers')
const PLACEHOLDER = '__CSP_SCRIPT_HASHES__'

function sha256Base64(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('base64')
}

async function collectInlineScriptHashes(): Promise<string[]> {
  const hashes = new Set<string>()
  const files = await glob('**/*.html', { cwd: DIST_DIR })

  for (const file of files) {
    const html = fs.readFileSync(path.join(DIST_DIR, file), 'utf-8')
    const root = parse(html)

    const scripts = root.querySelectorAll('script:not([src])')
    for (const script of scripts) {
      const content = script.rawText
      if (content.trim()) {
        hashes.add(`'sha256-${sha256Base64(content)}'`)
      }
    }
  }

  return Array.from(hashes)
}

async function main() {
  if (!fs.existsSync(HEADERS_PATH)) {
    console.error(`_headers not found: ${HEADERS_PATH}`)
    process.exit(1)
  }

  const hashes = await collectInlineScriptHashes()
  console.log(`Found ${hashes.length} inline script hash(es):`)
  hashes.forEach(h => console.log(`  ${h}`))

  const content = fs.readFileSync(HEADERS_PATH, 'utf-8')
  if (!content.includes(PLACEHOLDER)) {
    console.error(`Placeholder "${PLACEHOLDER}" not found in _headers`)
    process.exit(1)
  }

  const updated = content.replace(PLACEHOLDER, hashes.join(' '))
  fs.writeFileSync(HEADERS_PATH, updated, 'utf-8')
  console.log('CSP hashes updated in dist/client/_headers')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
