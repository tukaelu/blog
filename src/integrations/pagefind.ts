import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolve()
      else
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

export default function pagefind(): AstroIntegration {
  let clientDir: URL
  return {
    name: 'pagefind',
    hooks: {
      'astro:config:done': ({ config }) => {
        clientDir = config.outDir
      },
      'astro:build:done': async ({ logger }) => {
        const distDir = fileURLToPath(clientDir)

        logger.info('Building Pagefind search index...')
        await run('pnpm', ['exec', 'pagefind', '--site', distDir])

        const src = path.join(distDir, 'pagefind')
        const dest = path.resolve(process.cwd(), 'public', 'pagefind')
        fs.rmSync(dest, { recursive: true, force: true })
        fs.cpSync(src, dest, { recursive: true })
        logger.info(`Copied Pagefind index to ${dest}`)
      },
    },
  }
}
