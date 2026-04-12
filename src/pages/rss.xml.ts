import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getListablePosts } from '@lib/posts'
import { SITE_TITLE, SITE_DESCRIPTION } from '@lib/constants'

export async function GET(context: APIContext) {
  const posts = await getListablePosts()

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: new URL(`/posts/${post.data.slug}/`, context.site).href,
    })),
    customData: '<language>ja</language>',
  })
}
