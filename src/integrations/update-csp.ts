import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import { parse } from 'node-html-parser'

const PLACEHOLDER = '__CSP_SCRIPT_HASHES__'

function sha256Base64(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('base64')
}

export default function updateCsp(): AstroIntegration {
  let clientDir: URL
  return {
    name: 'update-csp',
    hooks: {
      'astro:config:done': ({ config }) => {
        clientDir = config.build.client ?? config.outDir
      },
      'astro:build:done': async ({ logger }) => {
        const distDir = fileURLToPath(clientDir)
        const headersPath = path.join(distDir, '_headers')

        if (!fs.existsSync(headersPath)) {
          throw new Error(`_headers not found: ${headersPath}`)
        }

        const hashes = new Set<string>()
        const files = await glob('**/*.html', { cwd: distDir })
        for (const file of files) {
          const html = fs.readFileSync(path.join(distDir, file), 'utf-8')
          const root = parse(html)
          const scripts = root.querySelectorAll('script:not([src])')
          for (const script of scripts) {
            const content = script.rawText
            if (content.trim()) {
              hashes.add(`'sha256-${sha256Base64(content)}'`)
            }
          }
        }

        const hashList = Array.from(hashes)
        logger.info(`Found ${hashList.length} inline script hash(es)`)

        const content = fs.readFileSync(headersPath, 'utf-8')
        if (!content.includes(PLACEHOLDER)) {
          throw new Error(`Placeholder "${PLACEHOLDER}" not found in _headers`)
        }

        const updated = content.replace(PLACEHOLDER, hashList.join(' '))
        fs.writeFileSync(headersPath, updated, 'utf-8')
        logger.info('CSP hashes updated in _headers')
      },
    },
  }
}
