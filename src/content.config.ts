import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const postSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  icon: z.string().optional(),
  draft: z.boolean().optional().default(false),
  unlisted: z.boolean().optional().default(false),
})

const posts = defineCollection({
  loader: glob({ pattern: 'ja/**/index.mdx', base: './contents/posts' }),
  schema: postSchema,
})

const enPosts = defineCollection({
  loader: glob({ pattern: 'en/**/index.mdx', base: './contents/posts' }),
  schema: postSchema,
})

export const collections = { posts, enPosts }
