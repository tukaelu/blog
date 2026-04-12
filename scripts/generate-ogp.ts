/**
 * Post-build script to generate OGP images.
 * Runs in Node.js (not in Cloudflare's build environment),
 * so native modules like @resvg/resvg-js work correctly.
 *
 * Usage: npx tsx scripts/generate-ogp.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'
import { generateOgpImage } from '../src/lib/ogp.ts'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const POSTS_DIR = path.resolve(process.cwd(), 'contents', 'posts')

async function collectPosts(pattern: string, outputDir: string) {
  const files = await glob(pattern, { cwd: POSTS_DIR })
  const posts: { slug: string; title: string; outputDir: string }[] = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data } = matter(content)
    if (data.draft) continue
    posts.push({ slug: data.slug, title: data.title, outputDir })
  }
  return posts
}

async function main() {
  const jaOgpDir = path.join(DIST_DIR, 'ogp')
  const enOgpDir = path.join(DIST_DIR, 'en', 'ogp')
  fs.mkdirSync(jaOgpDir, { recursive: true })
  fs.mkdirSync(enOgpDir, { recursive: true })

  const [jaPosts, enPosts] = await Promise.all([
    collectPosts('ja/**/index.mdx', jaOgpDir),
    collectPosts('en/**/index.mdx', enOgpDir),
  ])
  const posts = [...jaPosts, ...enPosts]

  console.log(`Generating OGP images for ${posts.length} posts...`)

  for (const post of posts) {
    const outputPath = path.join(post.outputDir, `${post.slug}.png`)
    try {
      const png = await generateOgpImage(post.title)
      fs.writeFileSync(outputPath, png)
      console.log(`  ✓ ${outputPath.replace(DIST_DIR, '')}`)
    } catch (err) {
      console.error(`  ✗ ${post.slug}.png:`, err)
    }
  }

  console.log('Done!')
}

main().catch(console.error)
