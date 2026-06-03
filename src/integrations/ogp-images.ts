import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'
import { generateOgpImage } from '../lib/ogp'

const POSTS_DIR = path.resolve(process.cwd(), 'contents', 'posts')

async function collectPosts(pattern: string) {
  const files = await glob(pattern, { cwd: POSTS_DIR })
  const posts: { slug: string; title: string }[] = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data } = matter(content)
    if (data.draft) continue
    posts.push({ slug: data.slug, title: data.title })
  }
  return posts
}

export default function ogpImages(): AstroIntegration {
  let clientDir: URL
  return {
    name: 'ogp-images',
    hooks: {
      'astro:config:done': ({ config }) => {
        clientDir = config.outDir
      },
      'astro:build:done': async ({ logger }) => {
        const distDir = fileURLToPath(clientDir)
        const jaOgpDir = path.join(distDir, 'ogp')
        const enOgpDir = path.join(distDir, 'en', 'ogp')
        fs.mkdirSync(jaOgpDir, { recursive: true })
        fs.mkdirSync(enOgpDir, { recursive: true })

        const [jaPosts, enPosts] = await Promise.all([
          collectPosts('ja/**/index.mdx'),
          collectPosts('en/**/index.mdx'),
        ])
        const posts = [
          ...jaPosts.map(p => ({ ...p, outputDir: jaOgpDir })),
          ...enPosts.map(p => ({ ...p, outputDir: enOgpDir })),
        ]

        logger.info(`Generating OGP images for ${posts.length} posts...`)

        for (const post of posts) {
          const outputPath = path.join(post.outputDir, `${post.slug}.png`)
          try {
            const png = await generateOgpImage(post.title)
            fs.writeFileSync(outputPath, png)
            logger.info(`  ✓ ${outputPath.replace(distDir, '')}`)
          } catch (err) {
            logger.error(`  ✗ ${post.slug}.png: ${err}`)
          }
        }
      },
    },
  }
}
